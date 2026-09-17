import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import InfoSection from "@/components/InfoSection";
import ExhibitionRaces from "@/components/ExhibitionRaces";
import HowToParticipate from "@/components/HowToParticipate";
import TeamSection from "@/components/TeamSection";
import ProgramSection from "@/components/ProgramSection";
import LocationSection from "@/components/LocationSection";
import Footer from "@/components/Footer";
import {
  EditionProvider,
  editionDisplayName,
  getEdition,
  getUpcomingEdition,
} from "@/editions";
import NotFound from "./NotFound";

const EditionPage = () => {
  const { slug } = useParams();
  const edition = slug ? getEdition(slug) : undefined;
  const upcoming = getUpcomingEdition();

  useEffect(() => {
    if (!edition) return;
    const previous = document.title;
    document.title = `${editionDisplayName(edition)} — архів`;
    return () => {
      document.title = previous;
    };
  }, [edition]);

  if (!edition) return <NotFound />;
  if (edition.slug === upcoming.slug) return <Navigate to="/" replace />;

  return (
    <EditionProvider edition={edition} mode="archive">
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
    </EditionProvider>
  );
};

export default EditionPage;
