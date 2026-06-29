import React from 'react'
import Hero from '../../components/Home/hero'
import Nav from '../../components/Home/nav'
import About from '../../components/Home/about'
import ForJobSeeker from '../../components/Home/forjobseeker'
import ForRecruiter from '../../components/Home/forrecruiter'
import FloatingEmailButton from '../../components/Home/contact'
const Home = () => {
  return (
    <div>
        <Nav />
      <Hero />
        <About />
        <ForJobSeeker />
        <ForRecruiter />
        <FloatingEmailButton />
    </div>
  )
}

export default Home
