"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus,
  BookOpen,
  Clock,
  X,
  FileText,
  Target,
  Award,
  CalendarDays,
  Users,
  MapPin,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface Event {
  id: string;
  title: string;
  subject: string;
  dateStr: string; // YYYY-MM-DD
  time: string;
  type: "Class" | "Quiz" | "Assignment" | "Grading" | "Meeting" | "Exam" | "Self-Study";
  location?: string;
  description?: string;
}

const categoryColors: Record<Event["type"], string> = {
  Class: "bg-blue-500/10 border-blue-500 text-blue-400",
  Exam: "bg-purple-500/15 border-purple-500 text-purple-400",
  Quiz: "bg-amber-500/10 border-amber-500 text-amber-400",
  Assignment: "bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-400",
  Grading: "bg-rose-500/10 border-rose-500 text-rose-400",
  Meeting: "bg-emerald-500/10 border-emerald-500 text-emerald-400",
  "Self-Study": "bg-cyan-500/10 border-cyan-500 text-cyan-400",
};

const categoryIcons: Record<Event["type"], LucideIcon> = {
  Class: BookOpen,
  Exam: ClipboardCheck,
  Quiz: Award,
  Assignment: FileText,
  Grading: Target,
  Meeting: Users,
  "Self-Study": Target,
};

interface CalendarPageProps {
  role: "teacher" | "student";
}

export default function CalendarPage({ role }: CalendarPageProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [time, setTime] = useState("");
  const [type, setType] = useState<Event["type"]>("Class");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [assignToAll, setAssignToAll] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' 
      ? (role === "teacher" ? localStorage.getItem("teacherToken") : localStorage.getItem("studentToken"))
      : null;
    if (!token) return;

    const endpoint = role === "teacher" 
      ? "http://localhost:5000/api/teacher/calendar/schedule" 
      : "http://localhost:5000/api/student/calendar/schedule";

    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.events) {
          setEvents(data.events);
        }
      })
      .catch(console.error);
  }, [role]);

  const selectedDateStr = selectedDate ? formatLocalDate(selectedDate) : "";
  const filteredEvents = events.filter((e) => e.dateStr === selectedDateStr);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDateStr) return;

    const newEvent = {
      title,
      subject,
      dateStr: selectedDateStr,
      time: time || "All day",
      type,
      location: location || undefined,
      description,
      assignToAll,
    };

    // Optimistic UI update for instant feedback
    const tempId = `temp-${Date.now()}`;
    const optimisticEvent = { ...newEvent, id: tempId };
    setEvents((prev) => [...prev, optimisticEvent as Event]);

    // Reset form immediately
    setTitle("");
    setSubject("Physics");
    setTime("");
    setType("Class");
    setLocation("");
    setDescription("");
    setAssignToAll(false);
    setShowAddForm(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem("teacherToken") : null;
    try {
      const res = await fetch("http://localhost:5000/api/teacher/calendar/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (data.success && data.event) {
        // Replace temp event with real event from server (with correct ID)
        setEvents((prev) => prev.map((evt) => (evt.id === tempId ? data.event : evt)));
      } else {
        // Revert if failed
        setEvents((prev) => prev.filter((evt) => evt.id !== tempId));
      }
    } catch (err) {
      console.error("Failed to create event", err);
      // Revert if network error
      setEvents((prev) => prev.filter((evt) => evt.id !== tempId));
    }
  };

  const handleDeleteEvent = async (id: string) => {
    // Optimistic delete
    const previousEvents = [...events];
    setEvents((prev) => prev.filter((e) => e.id !== id));

    const token = typeof window !== 'undefined' ? localStorage.getItem("teacherToken") : null;
    try {
      const res = await fetch(`http://localhost:5000/api/teacher/calendar/schedule/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Revert on failure
        setEvents(previousEvents);
      }
    } catch (err) {
      console.error("Failed to delete event", err);
      // Revert on failure
      setEvents(previousEvents);
    }
  };

  const hasEventOnDate = (date: Date) => {
    const dStr = formatLocalDate(date);
    return events.some((e) => e.dateStr === dStr);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen p-6 md:p-8 space-y-8">
      {/* Header section matching MALPHOR UI */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {role === "teacher" ? "Teaching Calendar" : "Study Calendar"}
        </h1>
        <p className="text-zinc-400 mt-2">
          {role === "teacher"
            ? "Schedule lectures, set quiz deadlines, and manage administration duties."
            : "View your upcoming classes and assigned tasks."}
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        {/* Left column: Calendar Date Picker */}
        <div className="md:col-span-5 lg:col-span-4 bg-zinc-900/50 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col items-center">
          <h3 className="font-semibold tracking-tight text-lg mb-4 text-left w-full flex items-center gap-2 text-white">
            <CalendarDays className="h-5 w-5 text-purple-400" />
            Pick a Date
          </h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border border-white/5 shadow-sm text-zinc-300"
            modifiers={{
              hasEvent: (date) => hasEventOnDate(date),
            }}
            modifiersClassNames={{
              hasEvent:
                "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-purple-500 after:rounded-full font-bold",
            }}
          />
        </div>

        {/* Right column: Day events */}
        <div className="md:col-span-7 lg:col-span-8 space-y-4">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  {selectedDate
                    ? selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : "Select a date"}
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}{" "}
                  scheduled
                </p>
              </div>
              
              {role === "teacher" && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-purple-900/20"
                >
                  {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {showAddForm ? "Cancel" : "Add Event"}
                </button>
              )}
            </div>

            <AnimatePresence>
              {showAddForm && role === "teacher" && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddEvent}
                  className="border border-white/10 bg-zinc-950/50 rounded-xl p-5 mb-6 space-y-4 overflow-hidden"
                >
                  <h4 className="font-semibold text-sm text-zinc-200">Add New Event</h4>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Event Title
                      </label>
                      <input
                        required
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Physics 101 Lecture"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 focus:border-purple-500 outline-none text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Physics, Math, Admin"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 focus:border-purple-500 outline-none text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Time
                      </label>
                      <input
                        type="text"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        placeholder="e.g. 11:00 AM - 12:30 PM"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 focus:border-purple-500 outline-none text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Type
                      </label>
                      <select
                        title="Event type"
                        value={type}
                        onChange={(e) => setType(e.target.value as Event["type"])}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 focus:border-purple-500 outline-none text-sm text-white"
                      >
                        <option value="Class">Class</option>
                        <option value="Exam">Exam</option>
                        <option value="Quiz">Quiz</option>
                        <option value="Assignment">Assignment</option>
                        <option value="Grading">Grading</option>
                        <option value="Meeting">Meeting</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Location / Place (Optional)
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Room 402, Lecture Hall A"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 focus:border-purple-500 outline-none text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide event details..."
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 focus:border-purple-500 outline-none text-sm text-white resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="assignToAll"
                      checked={assignToAll}
                      onChange={(e) => setAssignToAll(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-purple-500 focus:ring-purple-500/20"
                    />
                    <label htmlFor="assignToAll" className="text-sm font-medium text-zinc-300">
                      Publish to all students in course
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
                  >
                    Save Event
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <AnimatePresence>
                {filteredEvents.map((event) => {
                  const CategoryIcon = categoryIcons[event.type];
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={event.id}
                      className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-800/50 transition-colors relative group flex gap-3.5"
                    >
                      <div
                        className={`h-11 w-11 rounded-lg border flex items-center justify-center shrink-0 ${categoryColors[event.type]}`}
                      >
                        <CategoryIcon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            {event.subject}
                          </span>
                          <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {event.time}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm mt-1.5 text-zinc-100 leading-snug">
                          {event.title}
                        </h4>
                        {event.location && (
                          <p className="text-xs font-semibold text-purple-400 flex items-center gap-1 mt-1 leading-none">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{event.location}</span>
                          </p>
                        )}
                        {event.description && (
                          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {role === "teacher" && (
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete Event"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium text-zinc-400">No events scheduled for this day.</p>
                  <p className="text-xs mt-1">
                    {role === "teacher" 
                      ? "Click 'Add Event' to schedule lectures or assessments."
                      : "Enjoy your free time!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
