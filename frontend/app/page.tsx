"use client";

import { motion } from "framer-motion";
import { Download, Mail } from "lucide-react";
import { ChatWidget } from "@/components/chat-widget";
import { ThemeToggle } from "@/components/theme-toggle";

const projects = [
  {
    title: "DevCopilot RAG",
    summary: "Context-aware assistant for developer docs with citation-first answers.",
    stack: ["FastAPI", "Groq", "FAISS", "LangChain"],
  },
  {
    title: "Portfolio OS",
    summary: "Premium portfolio experience with smooth motion and adaptive themes.",
    stack: ["Next.js", "Tailwind", "Framer Motion", "ShadCN"],
  },
  {
    title: "Realtime Issue Triage",
    summary: "Automated support triage with streaming ingestion and smart routing.",
    stack: ["Python", "Kafka", "PostgreSQL", "Redis"],
  },
];

const skills = ["Python", "TypeScript", "FastAPI", "Next.js", "RAG", "Groq", "FAISS", "Docker"];

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-14 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-widest text-brand-400">AI ENGINEER PORTFOLIO</span>
        <ThemeToggle />
      </header>

      <section className="glass mb-12 bg-hero-glow p-10">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black tracking-tight sm:text-6xl"
        >
          Building AI Products that Feel Magical.
        </motion.h1>
        <p className="mt-5 max-w-2xl text-slate-700 dark:text-slate-300">
          Full-stack AI engineer focused on production-grade RAG systems, backend reliability, and polished interfaces.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/resume.txt" className="rounded-full bg-brand-500 px-5 py-2 text-white">
            <span className="inline-flex items-center gap-2"><Download size={16} /> Download Resume</span>
          </a>
          <a href="#contact" className="rounded-full border border-slate-300 px-5 py-2 dark:border-slate-700">
            <span className="inline-flex items-center gap-2"><Mail size={16} /> Contact Me</span>
          </a>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Featured Projects</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {projects.map((project, idx) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              viewport={{ once: true }}
              className="glass group p-5 transition hover:-translate-y-1 hover:shadow-glow"
            >
              <h3 className="text-lg font-semibold">{project.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{project.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <span key={item} className="rounded-full bg-slate-900 px-2 py-1 text-xs text-white dark:bg-slate-100 dark:text-slate-900">
                    {item}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Skills</h2>
        <div className="glass flex flex-wrap gap-3 p-6">
          {skills.map((skill, idx) => (
            <motion.span
              key={skill}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              viewport={{ once: true }}
              className="rounded-full border border-white/20 bg-white/30 px-3 py-1 text-sm dark:bg-white/10"
            >
              {skill}
            </motion.span>
          ))}
        </div>
      </section>

      <section id="contact" className="glass mb-20 p-8">
        <h2 className="text-2xl font-bold">Contact</h2>
        <p className="mt-2 text-slate-700 dark:text-slate-300">Email: you@example.com · LinkedIn: linkedin.com/in/yourname</p>
      </section>

      <ChatWidget />
    </main>
  );
}
