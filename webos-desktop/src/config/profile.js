/**
 * ==============================================================================
 *  Sital Bahadur Chaudhari - Profile, Social Links & Projects Configuration
 * ==============================================================================
 * 
 * Official details extracted from portfolio website (well-known):
 * These values automatically update About Sital, My Portfolio, Contact Me, and Projects.
 */

export const SITAL_PROFILE = {
  // 1. Personal Details:
  name: "Sital Bahadur Chaudhari",
  role: "Senior Data Analyst & Website Developer",
  subRole: "Freelancer | YouTuber | AI Enthusiast",
  location: "Nepalganj, Nepal",
  avatar: "/sital-photo.jpg",
  bio: "Hello! I'm Sital Bahadur Chaudhari, a Senior Data Analyst, Website Developer, Freelancer, and YouTuber based in Nepalganj, Nepal. With over 5+ years of comprehensive experience in data analytics, machine learning, statistical modeling, modern web development, and AI-powered solutions.",

  // 2. Social Media & Contact Links:
  links: {
    website: "https://sitalc.com.np/",
    github: "https://github.com/sitalcha",
    youtube: "https://www.youtube.com/@nptechonlineguru",
    facebook: "https://www.facebook.com/sital.cha",
    linkedin: "https://www.linkedin.com/in/rishabhnmishra/",
    email: "mailto:sitalcha4@gmail.com",
    emailDisplay: "sitalcha4@gmail.com",
    phone: "+9779847888080",
    phoneDisplay: "+977 9847888080",
    questionForm: "https://forms.gle/uLaTShUKXraAvHJ77"
  },

  // 3. Experience & Education:
  experience: [
    {
      period: "2021 - Present",
      role: "Senior Data Analyst",
      company: "Merkle (Dentsu International)",
      desc: "Analyzed ad campaigns, clickstream data, developed time-series forecasting models (92% accuracy), and executed rigorous A/B tests yielding 20% MoM conversion growth."
    },
    {
      period: "2018 - 2021",
      role: "Senior Data Analyst",
      company: "iQuanti",
      desc: "Market research & analytics, driving ~100% website growth and 30% YoY conversion increase. Mentored teams in SQL, Python, Power BI, and Tableau."
    }
  ],

  education: [
    {
      period: "2014 - 2018",
      degree: "Bachelor of Engineering",
      institution: "Visvesvaraya Technological University",
      grade: "First class distinction"
    },
    {
      period: "2012 - 2013",
      degree: "Higher Secondary School",
      institution: "Army Public School",
      grade: "First class distinction"
    }
  ],

  // 4. Skills & Technologies:
  skills: [
    { name: "SQL", level: "95%", icon: "fa-solid fa-database" },
    { name: "Python", level: "85%", icon: "fa-brands fa-python" },
    { name: "Data Visualization", level: "90%", icon: "fa-solid fa-chart-pie" },
    { name: "Statistical Analysis", level: "85%", icon: "fa-solid fa-square-root-variable" },
    { name: "Machine Learning", level: "80%", icon: "fa-solid fa-brain" },
    { name: "Power BI & Tableau", level: "90%", icon: "fa-solid fa-chart-line" },
    { name: "Web Development", level: "88%", icon: "fa-brands fa-html5" },
    { name: "JavaScript / React", level: "85%", icon: "fa-brands fa-js" }
  ],

  // 5. Featured Projects:
  projects: [
    {
      id: "portfolio-live",
      title: "sitalc.com.np",
      subtitle: "Personal Portfolio Website",
      desc: "Official personal portfolio website showcasing professional experience, data science projects, and web applications.",
      url: "https://sitalc.com.np/",
      icon: "/sital-logo.png",
      badge: "Portfolio"
    },
    {
      id: "kagaj-ai",
      title: "Kagaj AI",
      subtitle: "AI Document & PDF Assistant",
      desc: "AI-powered document and PDF analysis assistant designed to extract insights, summarize documents, and automate workflows.",
      url: "https://sitalc.com.np/",
      icon: "fa-solid fa-robot",
      badge: "AI Tool"
    },
    {
      id: "sql-music-store",
      title: "Digital Music Store Analysis",
      subtitle: "Advanced SQL Project",
      desc: "Analyzed music store database using complex SQL queries to identify growth opportunities, customer trends, and revenue drivers.",
      url: "https://github.com/rishabhnmishra/SQL_Music_Store_Analysis/blob/main/Music_Store_Query.sql",
      icon: "fa-solid fa-database",
      badge: "SQL"
    },
    {
      id: "python-sales",
      title: "Sales Data Analysis with Python",
      subtitle: "Python EDA Project",
      desc: "Exploratory data analysis on retail sales data using Python, Pandas, NumPy, Matplotlib, and Seaborn to optimize customer experience.",
      url: "https://github.com/rishabhnmishra/Python_Diwali_Sales_Analysis/blob/main/Diwali_Sales_Analysis.ipynb",
      icon: "fa-brands fa-python",
      badge: "Python"
    },
    {
      id: "powerbi-sales",
      title: "Sales Power BI Dashboard",
      subtitle: "Business Intelligence",
      desc: "Interactive business intelligence dashboard tracking online and retail sales performance across multiple regions.",
      url: "https://github.com/rishabhnmishra/Madhav_Store_Analysis_PowerBI/blob/main/Madhav%20Store%20dashboard.jpg",
      icon: "fa-solid fa-chart-simple",
      badge: "Power BI"
    },
    {
      id: "time-series-forecasting",
      title: "Sales Forecasting (Time Series)",
      subtitle: "Machine Learning",
      desc: "Implemented machine learning time-series forecasting models to predict retail demand and optimize marketing budgets.",
      url: "https://github.com/rishabhnmishra/sales_forecasting/tree/main",
      icon: "fa-solid fa-chart-line",
      badge: "ML"
    },
    {
      id: "customer-segmentation",
      title: "Customer Segmentation",
      subtitle: "Clustering Model",
      desc: "Machine learning clustering model providing data-driven recommendations for targeted financial products and consumer groups.",
      url: "https://github.com/rishabhnmishra/customer_segmentation/blob/main/Customer_Segmentation-final.ipynb",
      icon: "fa-solid fa-users",
      badge: "ML"
    },
    {
      id: "highwaypostdaily",
      title: "Highway Post Daily",
      subtitle: "News Portal Website",
      desc: "Digital news portal delivering timely headlines, investigative articles, and contemporary news coverage.",
      url: "https://highwaypostdaly.com/",
      icon: "fa-solid fa-newspaper",
      badge: "Web Portal"
    },
    {
      id: "saigarkhabar",
      title: "Saigar Khabar",
      subtitle: "Online News Portal",
      desc: "Comprehensive online media publishing verified news, regional reports, and editorial analysis in Nepal.",
      url: "https://saigarkhabar.com/",
      icon: "fa-solid fa-newspaper",
      badge: "News"
    },
    {
      id: "paschimeli",
      title: "Paschimeli",
      subtitle: "Paschimeli News Portal",
      desc: "Regional digital news portal dedicated to contemporary issues, social affairs, and western Nepal coverage.",
      url: "https://paschimeli.com/",
      icon: "fa-solid fa-newspaper",
      badge: "News"
    }
  ]
};
