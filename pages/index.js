import Head from "next/head";

const experience = [
  {
    company: "Royal Bank of Canada",
    role: "Software Engineering Intern",
    date: "Jul 2026 — Aug 2026",
    location: "Toronto, ON",
    bullets: [
      "Shipped an engineering intelligence platform used by 200+ banking apps across 1,200 repositories.",
      "Built service-health analysis across SonarQube, DAST, GitHub, and Snyk data, saving 12,000+ hours annually.",
      "Developed a modular React dashboard in an Nx monorepo and expanded regression coverage with Vitest and Playwright.",
    ],
    stack: ["React", "Nx", "Vitest", "Playwright", "SonarQube", "Snyk"],
  },
  {
    company: "Magna International",
    role: "Engineering Intern",
    date: "Jul 2024 — Aug 2024",
    location: "Newmarket, ON",
    bullets: [
      "Automated surface-geometry calculations with VBA, Excel, and CATIA V5, replacing manual analysis.",
      "Streamlined 100+ materials records for Teamcenter PLM ingestion and validated automotive hood-latch systems in the lab.",
    ],
    stack: ["VBA", "Excel", "CATIA V5", "Teamcenter", "Hardware validation"],
  },
];

const projects = [
  {
    index: "01",
    title: "SkyCell",
    eyebrow: "Apex Hackathon · 1st Place",
    description:
      "A high-altitude telemetry system flown to 30 km, with a 915 MHz LoRa/Meshtastic link spanning 70 km. I built the flight software, ground-station pipeline, and automated SDR spectrum capture for RF analysis.",
    metrics: ["30 km altitude", "70 km link", "30 MHz–1.5 GHz sweeps"],
    stack: ["Python", "LoRa", "Meshtastic", "NMEA", "RTL-SDR", "RF"],
    href: "https://github.com/sharonbasovich",
  },
  {
    index: "02",
    title: "USS Apocalypse",
    eyebrow: "Apocalypse Hackathon · 4th Place",
    description:
      "A CV-enabled drone and autonomous carrier. I built a real-time Python vision pipeline for target classification, waypoint navigation, ultrasonic avoidance, and an ESP32-CAM streaming/control system.",
    metrics: ["Real-time CV", "Autonomous carrier", "WebSocket video"],
    stack: ["Python", "OpenCV", "PyAV", "MediaPipe", "ESP32", "WebSockets"],
    href: "https://github.com/sharonbasovich",
  },
  {
    index: "03",
    title: "Tic-Tac-Toe Drawing Robot",
    eyebrow: "Undercity · Top 10",
    description:
      "A physical robot that plays and draws Tic-Tac-Toe moves in sync with a web app. The control layer uses queued COBS-encoded binary serial packets and a context-aware LLM chat interface.",
    metrics: ["Physical + web sync", "Binary serial protocol", "LLM interface"],
    stack: ["React", "TypeScript", "Flask", "COBS", "Serial", "LLM"],
    href: "https://github.com/sharonbasovich",
  },
];

const leadership = [
  ["Lions Robotics", "Vice President", "Led a 56-member, six-team organization to six World Championship qualifications while managing a $140,000 annual budget."],
  ["5 North American Hackathons", "Organizer", "Coordinated logistics for 300+ attendees and 97 projects, while leading full-stack event-platform development."],
  ["Robotics Club", "Co-Founder", "Built a free training pipeline by repurposing competition hardware and saving $20,000+ in equipment costs."],
];

const awards = [
  ["VEX Robotics World Championship Judges Award", "1 of 10 recipients among 9,565 teams"],
  ["Carnegie Mellon picoCTF", "113 / 10,460 · Top 1%"],
  ["Canadian Computing Competition", "Senior Honour Roll · Top 3%"],
  ["Hackathons", "7-time award winner across international events"],
];

const skills = [
  "C++", "C", "TypeScript", "JavaScript", "Java", "Python", "C#", "SQL", "React", "Next.js", "NestJS", "Node.js", "Flask", "PostgreSQL", "OpenCV", "PyTorch", "Git", "Linux"
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Sharon Basovich — Software, Robotics & Systems</title>
        <meta
          name="description"
          content="Sharon Basovich is an incoming University of Waterloo Computer Science student building software, robotics, and low-level systems."
        />
        <meta name="theme-color" content="#0b0d10" />
      </Head>

      <main>
        <nav className="nav shell">
          <a className="brand" href="#top" aria-label="Home">SB<span>.</span></a>
          <div className="navLinks">
            <a href="#work">Work</a>
            <a href="#experience">Experience</a>
            <a href="#about">About</a>
          </div>
          <a className="navCta" href="mailto:sharon@basovich.com">Say hello ↗</a>
        </nav>

        <section id="top" className="hero shell">
          <div className="heroKicker"><span className="statusDot" /> Incoming Waterloo CS · Toronto</div>
          <h1>I build software that <em>touches the real world.</em></h1>
          <div className="heroBottom">
            <p>
              I&apos;m Sharon Basovich, a software engineer and robotics builder interested in systems where software, hardware, and performance meet.
            </p>
            <div className="heroLinks">
              <a href="https://github.com/sharonbasovich" target="_blank" rel="noreferrer">GitHub ↗</a>
              <a href="https://www.linkedin.com/in/sharon-basovich" target="_blank" rel="noreferrer">LinkedIn ↗</a>
              <a href="mailto:sharon@basovich.com">Email ↗</a>
            </div>
          </div>
          <div className="heroStats">
            <div><strong>1,200</strong><span>repos impacted at RBC</span></div>
            <div><strong>70 km</strong><span>high-altitude radio link</span></div>
            <div><strong>$140k</strong><span>robotics budget managed</span></div>
            <div><strong>7×</strong><span>hackathon award winner</span></div>
          </div>
        </section>

        <section id="work" className="section shell">
          <div className="sectionHead">
            <span>01 / Selected work</span>
            <p>Projects where the interesting part is below the surface.</p>
          </div>
          <div className="projects">
            {projects.map((project) => (
              <article className="project" key={project.title}>
                <div className="projectIndex">{project.index}</div>
                <div className="projectBody">
                  <div className="eyebrow">{project.eyebrow}</div>
                  <h2>{project.title}</h2>
                  <p>{project.description}</p>
                  <div className="metricRow">
                    {project.metrics.map((metric) => <span key={metric}>{metric}</span>)}
                  </div>
                  <div className="tagRow">
                    {project.stack.map((item) => <span key={item}>{item}</span>)}
                  </div>
                </div>
                <a className="projectArrow" href={project.href} target="_blank" rel="noreferrer" aria-label={`View ${project.title}`}>↗</a>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="section shell">
          <div className="sectionHead">
            <span>02 / Experience</span>
            <p>Shipping production software and engineering physical systems.</p>
          </div>
          <div className="timeline">
            {experience.map((job) => (
              <article className="job" key={job.company}>
                <div className="jobMeta">
                  <span>{job.date}</span>
                  <span>{job.location}</span>
                </div>
                <div className="jobContent">
                  <h3>{job.company}</h3>
                  <div className="jobRole">{job.role}</div>
                  <ul>{job.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                  <div className="tagRow">{job.stack.map((item) => <span key={item}>{item}</span>)}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section shell">
          <div className="sectionHead">
            <span>03 / Leadership</span>
            <p>Building teams and infrastructure around ambitious technical work.</p>
          </div>
          <div className="leadershipGrid">
            {leadership.map(([name, role, copy], i) => (
              <article className="leadershipCard" key={name}>
                <span>0{i + 1}</span>
                <h3>{name}</h3>
                <div>{role}</div>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section shell splitSection">
          <div>
            <div className="sectionHead compact"><span>04 / Recognition</span></div>
            <div className="awards">
              {awards.map(([title, detail]) => (
                <div className="award" key={title}><strong>{title}</strong><span>{detail}</span></div>
              ))}
            </div>
          </div>
          <div>
            <div className="sectionHead compact"><span>05 / Toolkit</span></div>
            <div className="skills">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
          </div>
        </section>

        <section id="about" className="about shell">
          <span className="aboutLabel">06 / About</span>
          <h2>Engineer first. Curious about everything.</h2>
          <div className="aboutGrid">
            <p>
              I&apos;m an incoming Computer Science student at the University of Waterloo. Competitive robotics pulled me into C++ and autonomous systems; hackathons pushed me toward rapid full-stack building; production engineering at RBC showed me what it takes to ship software at scale.
            </p>
            <p>
              I&apos;m especially drawn to low-level systems, quantitative engineering, robotics, security, and any problem where reliability and performance matter. Outside of building, I ski, read, and spend too much time turning small technical ideas into unnecessarily serious projects.
            </p>
          </div>
        </section>

        <footer className="footer shell">
          <div>
            <span>Have an interesting problem?</span>
            <a href="mailto:sharon@basovich.com">sharon@basovich.com ↗</a>
          </div>
          <div className="footerLinks">
            <a href="https://github.com/sharonbasovich" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/sharon-basovich" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
          <span className="footerMark">SB.</span>
        </footer>
      </main>
    </>
  );
}
