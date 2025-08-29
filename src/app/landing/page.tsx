import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/sections/Hero';
import Purpose from '@/components/sections/Purpose';
import HowItHelps from '@/components/sections/HowItHelps';
import HowToPost from '@/components/sections/HowToPost';
import Features from '@/components/sections/Features';
import Testimonials from '@/components/sections/Testimonials';

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