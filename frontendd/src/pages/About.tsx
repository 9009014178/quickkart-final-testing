import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Award, Zap } from 'lucide-react';
import BackButton from '@/components/BackButton';

import siddharthImg from '../assets/Siddharth Profile.jpg';
import shivamImg from '../assets/Shivam Profile.jpg';
import shlokImg from '../assets/Shlok Profile.jpg';
import shreyanshImg from '../assets/Shreyansh Profile.jpg';

const About: React.FC = () => {
  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We put our customers at the heart of everything we do, ensuring exceptional service and satisfaction.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a community of happy shoppers who trust us for quality products and reliable service.',
    },
    {
      icon: Award,
      title: 'Quality',
      description: 'We source only the finest products from trusted brands and manufacturers worldwide.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Constantly improving our platform to provide the best shopping experience possible.',
    },
  ];

  const team = [
    { name: 'Siddharth Saxena', role: 'Backend-Team', image: siddharthImg },
    { name: 'Shivam Dangi', role: 'Backend-Team', image: shivamImg },
    { name: 'Shreyansh Rathore', role: 'Frontend-Team', image: shreyanshImg },
    { name: 'Shlok Rathore', role: 'Frontend-Team', image: shlokImg },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <BackButton className="mb-8" />

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
            About <span className="gradient-text">QuickKart</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to revolutionize quick commerce in India by delivering daily essentials 
            in just 5-10 minutes. Founded in 2025, QuickKart serves thousands of happy customers across 
            major Indian cities with lightning-fast delivery.
          </p>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-2 gap-12 items-center mb-20"
        >
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">Our Story</h2>
            <p className="text-muted-foreground">
              QuickKart was born from a simple idea: daily essentials should reach you instantly. 
              What started as a small team of passionate entrepreneurs has grown into India's fastest 
              quick commerce platform.
            </p>
            <p className="text-muted-foreground">
              Convenience shouldn't come at a premium. We work directly with local suppliers and brands 
              to bring you the freshest products at the best prices, delivered faster than you can imagine.
            </p>
          </div>
          <div className="relative">
            <div className="bg-gradient-card rounded-3xl p-8 transform hover:scale-105 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600"
                alt="Our team"
                className="w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do and help us deliver the best experience for our customers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The passionate people behind QuickKart who work tirelessly to bring you lightning-fast delivery.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center group"
              >
                <div className="relative mb-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{member.name}</h3>
                <p className="text-brand-primary font-medium">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-card rounded-3xl p-12"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">QuickKart by the Numbers</h2>
            <p className="text-muted-foreground">Here's what we've achieved with our lightning-fast delivery network.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">50K+</div>
              <div className="text-muted-foreground">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">5-10</div>
              <div className="text-muted-foreground">Minutes Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">99%</div>
              <div className="text-muted-foreground">On-Time Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">15+</div>
              <div className="text-muted-foreground">Cities Served</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;