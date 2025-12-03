import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  fallbackTo?: string;      // Route to navigate if history is empty
  className?: string;       // Optional extra CSS classes
}

const BackButton: React.FC<BackButtonProps> = ({ fallbackTo = '/', className = '' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);  // Go back if possible
    } else {
      navigate(fallbackTo); // Otherwise, go to fallback route
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Button
        variant="ghost"
        onClick={handleBack}
        className="group flex items-center gap-2 hover:bg-card hover:scale-105 transition-all duration-200"
      >
        <motion.div
          whileHover={{ x: -2 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.div>
        <span>Back</span>
      </Button>
    </motion.div>
  );
};

export default BackButton;