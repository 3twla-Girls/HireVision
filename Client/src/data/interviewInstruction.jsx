import { Camera, Headphones, Eye, Timer } from 'lucide-react'; // تأكدي من عمل الـ Import هنا

export const INSTRUCTIONS_DATA = [
  {
    id: 1,
    icon: <Camera size={20} className="text-light-blue" />,
    title: "Check Your Hardware",
    desc: "Ensure your camera and microphone are working properly for accurate voice and sentiment analysis."
  },
  {
    id: 2,
    icon: <Headphones size={20} className="text-light-blue" />,
    title: "Find a Quiet Space",
    desc: "AI analysis works best in a well-lit, quiet environment to minimize background noise."
  },
  {
    id: 3,
    icon: <Eye size={20} className="text-light-blue" />,
    title: "Be Authentic",
    desc: "Treat this as a real interview. Speak clearly, maintain 'eye contact' with the camera, and be yourself."
  },
  {
    id: 4,
    icon: <Timer size={20} className="text-light-blue" />,
    title: "Track Your Time",
    desc: "Try to keep your answers concise (between 1-2 minutes). The AI will provide feedback on your pacing."
  }
];