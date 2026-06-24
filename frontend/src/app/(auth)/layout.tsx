import { BackgroundScene } from '@/components/3d/BackgroundScene';
import { Navbar } from '@/components/layout/Navbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex flex-col">
      <BackgroundScene />
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 mt-16">
        <div className="w-full max-w-md z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
