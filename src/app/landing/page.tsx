import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/sections/hero';
import Purpose from '@/components/sections/purpose';
import HowItHelps from '@/components/sections/howItHelps';
import HowToPost from '@/components/sections/howToPost';
import Features from '@/components/sections/features';
import Testimonials from '@/components/sections/testimonials';

function App() {
  return (
    <div className="bg-white">
      <Header />
      <main>
        <Hero />
        <Purpose />
        <HowItHelps />
        <HowToPost />
        <Features />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}

export default App;