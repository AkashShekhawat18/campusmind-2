const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role; // TEACHER or STUDENT
    
    let events = [];
    if (role === 'TEACHER') {
      events = await prisma.event.findMany({
        where: { userId }
      });
    } else {
      // For students, fetch events assigned to all or global events
      events = await prisma.event.findMany({
        where: { assignToAll: true }
      });
    }
    
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, subject, dateStr, time, type, location, description, assignToAll } = req.body;
    
    const event = await prisma.event.create({
      data: {
        title,
        subject,
        dateStr,
        time,
        type,
        location,
        description,
        assignToAll: assignToAll || false,
        userId
      }
    });
    
    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await prisma.event.delete({ where: { id } });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getEvents,
  createEvent,
  deleteEvent
};
