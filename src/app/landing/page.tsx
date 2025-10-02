import LandingHeader from '@/app/landing/about/LandingHeader';
import Hero from '@/app/landing/about/Hero';
import Purpose from '@/app/landing/about/Purpose';
import HowItHelps from '@/app/landing/about/HowItHelps';
import HowToPost from '@/app/landing/about/HowToPost';
import Features from '@/app/landing/about/Features';
import Testimonials from '@/app/landing/about/Testimonials';

function App() {
  return (
    <div className="bg-readowl-purple-dark/10">
      <LandingHeader />
      <main>
        <Hero />
        <Purpose />
        <HowItHelps />
        <HowToPost />
        <Features />
        <Testimonials />
      </main>
    </div>
  );
}

export default App;