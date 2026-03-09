import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import InfoSection from "@/components/InfoSection";
import ExhibitionRaces from "@/components/ExhibitionRaces";
import HowToParticipate from "@/components/HowToParticipate";
import TeamSection from "@/components/TeamSection";
import ProgramSection from "@/components/ProgramSection";
import LocationSection from "@/components/LocationSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <InfoSection />
      <ExhibitionRaces />
      <HowToParticipate />
      <TeamSection />
      <ProgramSection />
      <LocationSection />
      <Footer />
    </div>
  );
};

export default Index;
