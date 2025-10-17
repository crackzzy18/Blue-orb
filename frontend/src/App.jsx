import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Curricula from './pages/Curricula';
import Exams from './pages/Exams';
import Materials from './pages/Materials';
import Community from './pages/Community';
import MyQuestions from './pages/MyQuestions';
import MyReplies from './pages/MyReplies';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/curricula" element={<Curricula />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/my-questions" element={<MyQuestions />} />
            <Route path="/community/my-replies" element={<MyReplies />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
