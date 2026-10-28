// Word pools for prisma/seed-showcase.ts: names, universities, event specs,
// project ideas and team names. Plain data, no logic. Everything here is shown
// at a live demo, so keep it realistic and neutral: no lorem ipsum, no jokes
// at anyone's expense. Company names are made up on purpose; universities and
// IT Park are real hosts of student hackathons in Uzbekistan.

export const MALE_FIRST = [
  "Abbos", "Abdulla", "Akmal", "Alisher", "Anvar", "Asadbek", "Asilbek",
  "Aziz", "Azizbek", "Bahodir", "Behruz", "Bekzod", "Bobur", "Davron",
  "Diyorbek", "Doniyor", "Eldor", "Farrukh", "Firdavs", "Ibrohim", "Ilhom",
  "Islom", "Jahongir", "Jamshid", "Jasur", "Javlon", "Kamol", "Komil",
  "Laziz", "Mansur", "Mirjalol", "Muhammadali", "Nodir", "Nurbek", "Otabek",
  "Oybek", "Ozodbek", "Rustam", "Samandar", "Sanjar", "Sardor", "Shahzod",
  "Sherzod", "Shohruh", "Sirojiddin", "Temur", "Ulugbek", "Umid", "Khurshid",
  "Yusuf", "Zafar", "Shavkat", "Dilshod", "Jakhongir", "Muhammadyusuf",
  "Islombek", "Saidakbar", "Botir", "Rasul", "Elyor",
] as const;

export const FEMALE_FIRST = [
  "Asal", "Aziza", "Barno", "Charos", "Dildora", "Dilnoza", "Diyora",
  "Durdona", "Farangiz", "Feruza", "Gulbahor", "Gulnora", "Hilola", "Iroda",
  "Kamola", "Komila", "Laylo", "Lola", "Madina", "Maftuna", "Malika",
  "Marjona", "Mohinur", "Mubina", "Munisa", "Muslima", "Nargiza", "Nigora",
  "Nilufar", "Nodira", "Nozima", "Ozoda", "Rayhona", "Robiya", "Rukhshona",
  "Sabina", "Sarvinoz", "Sevara", "Shahnoza", "Shahzoda", "Sitora", "Umida",
  "Yulduz", "Zarina", "Zilola", "Zuhra", "Gulshan", "Mukhlisa", "Dilafruz",
  "Mohira",
] as const;

/** Male form; the female form adds "a" (Karimov → Karimova, Aliyev → Aliyeva). */
export const UZBEK_SURNAMES = [
  "Abdullayev", "Ahmedov", "Alimov", "Aliyev", "Azimov", "Bakirov",
  "Boboyev", "Ergashev", "Fayzullayev", "Ganiyev", "Hamidov", "Hasanov",
  "Ibragimov", "Ismoilov", "Jurayev", "Karimov", "Kamalov", "Komilov",
  "Latipov", "Mahmudov", "Mirzayev", "Musayev", "Nazarov", "Normatov",
  "Nurmatov", "Ochilov", "Qodirov", "Rahimov", "Rashidov", "Rasulov",
  "Saidov", "Sultonov", "Sharipov", "Tursunov", "Toshmatov", "Umarov",
  "Usmonov", "Valiyev", "Kholmatov", "Yusupov", "Yuldashev", "Zakirov",
  "Mamatov", "Nematov", "Qosimov", "Sobirov", "Turgunov", "Khudoyberdiyev",
  "Muminov", "Salimov", "Islomov", "Haydarov", "Shukurov", "Jalilov",
  "Odilov", "Pulatov", "Rustamov", "Safarov", "Tojiyev", "Akhmedov",
  "Davletov", "Eshonqulov", "Hakimov", "Inoyatov", "Juraboyev",
  "Khamrayev", "Mukhtorov", "Nabiyev", "Obidov", "Rakhmonov",
] as const;

/** Other names common in Uzbekistan (Korean, Russian, Tatar families). */
export const OTHER_PEOPLE = {
  maleFirst: ["Artyom", "Dmitriy", "Aleksandr", "Maksim", "Nikita", "Denis", "Ruslan", "Eldar", "Timur", "Vladislav"],
  femaleFirst: ["Yelena", "Anastasiya", "Kristina", "Valeriya", "Polina", "Viktoriya", "Kamila", "Elina", "Alina", "Diana"],
  /** Korean family names: the same for men and women. */
  neutralSurnames: ["Kim", "Pak", "Li", "Tsoy", "Ten", "Khan", "Shin"],
  /** Male form; the female form adds "a". */
  surnames: ["Ivanov", "Petrov", "Smirnov", "Kuznetsov", "Popov", "Volkov", "Sokolov", "Morozov", "Galiyev", "Sabirov"],
};

/** Real Uzbek mobile operator codes (+998 XX). */
export const OPERATOR_CODES = ["90", "91", "93", "94", "95", "97", "98", "99", "33", "88", "77"] as const;

export const UNIVERSITIES = [
  "Inha University in Tashkent",
  "Westminster International University in Tashkent",
  "TUIT (Tashkent University of Information Technologies)",
  "New Uzbekistan University",
  "Turin Polytechnic University in Tashkent",
  "Samarkand State University",
  "Bukhara State University",
  "National University of Uzbekistan",
  "Webster University in Tashkent",
  "Akfa University",
  "Central Asian University",
  "Tashkent State University of Economics",
  "Amity University Tashkent",
] as const;

/** Faculty → skills that fit it. A profile mixes its faculty's skills with a few general ones. */
export const FACULTIES: { name: string; weight: number; skills: string[] }[] = [
  { name: "Computer Science", weight: 18, skills: ["Python", "Java", "C++", "Algorithms", "Go", "Rust", "Linux", "Git", "PostgreSQL", "TypeScript"] },
  { name: "Software Engineering", weight: 18, skills: ["React", "TypeScript", "Next.js", "Node.js", "Django", "Spring Boot", "Docker", "PostgreSQL", "GraphQL", "Flutter", "Kotlin", "Swift", "Laravel", "Vue.js"] },
  { name: "Information Systems", weight: 8, skills: ["SQL", "Power BI", "Business analysis", "Java", "PHP", "Laravel", "Excel", "Project management"] },
  { name: "Data Science", weight: 9, skills: ["Python", "Pandas", "Machine learning", "PyTorch", "TensorFlow", "SQL", "Data visualisation", "Statistics", "NLP", "Computer vision"] },
  { name: "Cybersecurity", weight: 7, skills: ["Penetration testing", "Network security", "Linux", "Python", "Reverse engineering", "Cryptography", "Wireshark", "Web security"] },
  { name: "Business Informatics", weight: 6, skills: ["Product management", "SQL", "Power BI", "Market research", "Pitching", "Excel", "Figma"] },
  { name: "Computer Engineering", weight: 7, skills: ["C", "Embedded C", "Arduino", "Raspberry Pi", "IoT", "PCB design", "Python", "Linux"] },
  { name: "Applied Mathematics", weight: 5, skills: ["Python", "Statistics", "MATLAB", "Optimisation", "Machine learning", "R"] },
  { name: "Artificial Intelligence", weight: 5, skills: ["Python", "PyTorch", "LLM apps", "NLP", "Computer vision", "FastAPI", "Prompt engineering"] },
  { name: "Telecommunications", weight: 4, skills: ["Networking", "Linux", "C++", "5G basics", "Python", "Signal processing"] },
  { name: "Industrial Design", weight: 4, skills: ["Figma", "UI design", "UX research", "Prototyping", "Blender", "Illustration"] },
  { name: "Economics", weight: 4, skills: ["Excel", "Financial modelling", "Pitching", "Market research", "Presentations", "Power BI"] },
  { name: "Management", weight: 3, skills: ["Project management", "Pitching", "Marketing", "Presentations", "Business analysis"] },
  { name: "Finance", weight: 2, skills: ["Financial modelling", "Excel", "SQL", "Risk analysis", "Pitching"] },
];

/** Skills that aren't a tool or technology: kept out of "Built with …" and bio sentences about tools. */
export const SOFT_SKILLS = [
  "English", "Teamwork", "Public speaking", "Presentations", "Pitching",
  "Market research", "Project management", "Business analysis", "Marketing",
  "Product management", "UX research", "Risk analysis", "Financial modelling",
];

export const GENERAL_SKILLS = [
  "Git", "Figma", "Docker", "Pitching", "English", "Teamwork", "Public speaking",
  "Telegram bots", "Firebase", "Tailwind CSS", "REST APIs", "Unity",
] as const;

/**
 * Bio sentences. {faculty}, {uni}, {skillA} and {skillB} are filled in, plus
 * {year} ("Third-year", "Master's") and {yearLower} ("third year", "master's
 * programme") from YEARS_OF_STUDY.
 */
export const BIO_OPENERS = [
  "{year} {faculty} student at {uni}.",
  "I study {faculty} at {uni}, now in my {yearLower}.",
  "{faculty} student at {uni} who likes building things people actually use.",
  "{year} student at {uni}, studying {faculty}.",
];
export const BIO_MIDDLES = [
  "Most of my projects use {skillA} and {skillB}.",
  "I work mainly with {skillA}, and I am learning more {skillB} this semester.",
  "Comfortable with {skillA} and {skillB}, and happy to pick up whatever the team needs.",
  "I usually take the {skillA} side of a project, with some {skillB} when needed.",
  "My strongest tools are {skillA} and {skillB}.",
];
/** For people with a single tool skill, so no sentence names it twice. */
export const BIO_MIDDLES_ONE = [
  "Most of my projects use {skillA}.",
  "I work mainly with {skillA}, and I am learning a second stack this semester.",
  "Comfortable with {skillA}, and happy to pick up whatever the team needs.",
  "I usually take the {skillA} side of a project.",
  "My strongest tool is {skillA}.",
];
export const BIO_EXTRAS = [
  "Took part in two hackathons last year and placed in the top five at one of them.",
  "I help run the programming club at my faculty.",
  "Interned at a Tashkent startup over the summer, working on their mobile app.",
  "I like clear specs, small commits and demos that work on the first try.",
  "Interested in fintech and how payments work in Uzbekistan.",
  "I volunteer as a mentor for school students learning to code.",
  "Currently building a Telegram bot for my dormitory.",
  "Big fan of good UX and fast-loading pages.",
  "I prefer working in small teams with a clear plan for the demo.",
  "Learning about machine learning in my spare time.",
  "I enjoy the pitching part as much as the coding.",
  "Looking for teammates who want to ship something real in 48 hours.",
];

export const YEARS_OF_STUDY = [
  { year: "First-year", yearLower: "first year" },
  { year: "Second-year", yearLower: "second year" },
  { year: "Third-year", yearLower: "third year" },
  { year: "Fourth-year", yearLower: "fourth year" },
  { year: "Graduate", yearLower: "master's programme" },
] as const;

export const ORGANIZER_ROLES = [
  { faculty: "Innovation Office", bio: "I run the student innovation programme and our hackathons. Ask me anything about the schedule, the venue or the prizes." },
  { faculty: "Developer Relations", bio: "Developer relations lead. I organise hackathons and meetups for student developers in Tashkent, Samarkand and Bukhara." },
  { faculty: "Startup Incubator", bio: "Programme manager at a startup incubator. Every winning team from our hackathons gets a slot in the next intake." },
  { faculty: "Career Centre", bio: "I connect students with companies through hackathons, internships and project weeks." },
  { faculty: "Student Affairs", bio: "Event coordinator for student tech events. I care about clear rules, fair judging and good food on day two." },
];

export const JUDGE_ROLES = [
  "Engineering lead", "Senior backend engineer", "Head of product", "Data science lead",
  "CTO", "Security engineer", "Senior frontend engineer", "Mobile team lead",
  "Startup founder", "Associate professor", "UX lead", "Machine learning engineer",
  "Venture partner", "Platform engineer", "Head of design",
];
export const JUDGE_FOCUS = [
  "I look for a working demo and a clear reason for each technical choice.",
  "I pay attention to whether the team talked to real users before building.",
  "I judge on how far the team got, not on how polished the slides are.",
  "Good code structure and a readable repository count for a lot with me.",
  "I like ideas that could become a real product in Uzbekistan within a year.",
  "Security and data privacy are the first things I ask about.",
];
export const JUDGE_FACULTIES = [
  "Software Engineering", "Computer Science", "Data Science", "Cybersecurity",
  "Business Informatics", "Industrial Design",
];

/** Made-up companies used as hosts, judges' employers and mentors. */
export const COMPANIES = [
  "Registan Labs", "Zarafshan Cloud", "Afrosiyob Digital", "Silk Road Payments",
  "Kelajak Ventures", "Ilm Academy", "Shifo Health Tech", "Maydon Logistics",
  "Bozor Commerce", "Sayyoh Travel Tech", "Yashil Energy", "Dala Agro Tech",
  "Pixel Caravan Studio",
] as const;

export type Theme =
  | "ai" | "fintech" | "govtech" | "edtech" | "health" | "game" | "ctf"
  | "agri" | "climate" | "mobility" | "heritage" | "commerce" | "social" | "iot";

export type EventSpec = {
  name: string;
  theme: Theme;
  host: string;
  city: "Tashkent" | "Samarkand" | "Bukhara";
  venue: string;
  /** Who may register. Women in Tech registers women only. */
  audience?: "women";
};

/** 50 events, each name unique. */
export const EVENTS: EventSpec[] = [
  { name: "Tashkent AI Weekend", theme: "ai", host: "IT Park Uzbekistan", city: "Tashkent", venue: "IT Park in Mirzo Ulugbek district" },
  { name: "Registan Labs ML Sprint", theme: "ai", host: "Registan Labs", city: "Samarkand", venue: "the Registan Labs office on University Boulevard" },
  { name: "Uzbek Language AI Hackathon", theme: "ai", host: "National University of Uzbekistan", city: "Tashkent", venue: "the NUU main campus in Olmazor" },
  { name: "Computer Vision Cup", theme: "ai", host: "Inha University in Tashkent", city: "Tashkent", venue: "the Inha University library hall on Ziyolilar Street" },
  { name: "Generative AI for Business", theme: "ai", host: "Kelajak Ventures", city: "Tashkent", venue: "the Kelajak Ventures hub in Tashkent City" },
  { name: "Open Banking Hack", theme: "fintech", host: "Silk Road Payments", city: "Tashkent", venue: "the Silk Road Payments office in Tashkent City" },
  { name: "FinTech Sprint Samarkand", theme: "fintech", host: "Samarkand State University", city: "Samarkand", venue: "the Samarkand State University main building" },
  { name: "Microfinance for Mahallas", theme: "fintech", host: "Westminster International University in Tashkent", city: "Tashkent", venue: "the WIUT campus on Istiqbol Street" },
  { name: "Payments Weekend Bukhara", theme: "fintech", host: "IT Park Bukhara", city: "Bukhara", venue: "IT Park Bukhara" },
  { name: "GovTech Challenge Tashkent", theme: "govtech", host: "IT Park Uzbekistan", city: "Tashkent", venue: "IT Park in Mirzo Ulugbek district" },
  { name: "Public Services UX Jam", theme: "govtech", host: "Akfa University", city: "Tashkent", venue: "the Akfa University campus" },
  { name: "Digital Mahalla Hackathon", theme: "govtech", host: "TUIT", city: "Tashkent", venue: "the TUIT main campus on Amir Temur Avenue" },
  { name: "Bukhara Smart City Challenge", theme: "mobility", host: "Bukhara State University", city: "Bukhara", venue: "Bukhara State University on Muhammad Iqbol Street" },
  { name: "Tashkent Mobility Hack", theme: "mobility", host: "Maydon Logistics", city: "Tashkent", venue: "the Maydon Logistics office in Yunusabad" },
  { name: "Metro and Bus Data Jam", theme: "mobility", host: "Akfa University", city: "Tashkent", venue: "the Akfa University campus" },
  { name: "EdTech Build Week", theme: "edtech", host: "Ilm Academy", city: "Tashkent", venue: "the Ilm Academy learning centre in Yunusabad" },
  { name: "Classroom of Tomorrow", theme: "edtech", host: "TUIT", city: "Tashkent", venue: "the TUIT main campus on Amir Temur Avenue" },
  { name: "Samarkand EdTech Weekend", theme: "edtech", host: "Samarkand State University", city: "Samarkand", venue: "the Samarkand State University main building" },
  { name: "Learn to Code Jam", theme: "edtech", host: "Central Asian University", city: "Tashkent", venue: "the Central Asian University campus" },
  { name: "HealthTech Hackathon Tashkent", theme: "health", host: "Shifo Health Tech", city: "Tashkent", venue: "the Shifo Health Tech office in Chilanzar" },
  { name: "Clinic Queue Challenge", theme: "health", host: "Turin Polytechnic University in Tashkent", city: "Tashkent", venue: "the Turin Polytechnic campus on Kichik Halqa Yo'li" },
  { name: "Bukhara Health Data Weekend", theme: "health", host: "Bukhara State University", city: "Bukhara", venue: "Bukhara State University on Muhammad Iqbol Street" },
  { name: "Student Wellbeing Hack", theme: "health", host: "Webster University in Tashkent", city: "Tashkent", venue: "the Webster University campus" },
  { name: "Tashkent Game Jam", theme: "game", host: "Pixel Caravan Studio", city: "Tashkent", venue: "the Pixel Caravan Studio office in Mirabad" },
  { name: "Samarkand Game Jam", theme: "game", host: "Samarkand State University", city: "Samarkand", venue: "the Samarkand State University main building" },
  { name: "Silk Road Indie Game Jam", theme: "game", host: "IT Park Uzbekistan", city: "Tashkent", venue: "IT Park in Mirzo Ulugbek district" },
  { name: "Mobile Games Weekend", theme: "game", host: "Afrosiyob Digital", city: "Samarkand", venue: "the Afrosiyob Digital studio" },
  { name: "Capture the Flag Tashkent", theme: "ctf", host: "TUIT", city: "Tashkent", venue: "the TUIT main campus on Amir Temur Avenue" },
  { name: "Cyber Shield CTF", theme: "ctf", host: "Zarafshan Cloud", city: "Tashkent", venue: "the Zarafshan Cloud office in Mirzo Ulugbek district" },
  { name: "Student Security Cup", theme: "ctf", host: "Inha University in Tashkent", city: "Tashkent", venue: "the Inha University library hall on Ziyolilar Street" },
  { name: "Bukhara CTF Night", theme: "ctf", host: "IT Park Bukhara", city: "Bukhara", venue: "IT Park Bukhara" },
  { name: "AgriTech Hack Samarkand", theme: "agri", host: "Dala Agro Tech", city: "Samarkand", venue: "the Dala Agro Tech field office near Samarkand" },
  { name: "Smart Irrigation Challenge", theme: "agri", host: "National University of Uzbekistan", city: "Tashkent", venue: "the NUU main campus in Olmazor" },
  { name: "Farm to Market Hackathon", theme: "agri", host: "Bukhara State University", city: "Bukhara", venue: "Bukhara State University on Muhammad Iqbol Street" },
  { name: "Climate Action Hack", theme: "climate", host: "Yashil Energy", city: "Tashkent", venue: "the Yashil Energy office in Yakkasaray" },
  { name: "Aral Sea Data Challenge", theme: "climate", host: "National University of Uzbekistan", city: "Tashkent", venue: "the NUU main campus in Olmazor" },
  { name: "Clean Energy Weekend", theme: "climate", host: "Turin Polytechnic University in Tashkent", city: "Tashkent", venue: "the Turin Polytechnic campus on Kichik Halqa Yo'li" },
  { name: "Green Bukhara Hack", theme: "climate", host: "Bukhara State University", city: "Bukhara", venue: "Bukhara State University on Muhammad Iqbol Street" },
  { name: "Samarkand Smart Tourism", theme: "heritage", host: "Sayyoh Travel Tech", city: "Samarkand", venue: "the Sayyoh Travel Tech office near Registan Square" },
  { name: "Heritage Tech Jam Bukhara", theme: "heritage", host: "Bukhara State University", city: "Bukhara", venue: "Bukhara State University on Muhammad Iqbol Street" },
  { name: "Silk Road Tourism Hackathon", theme: "heritage", host: "Silk Road International University of Tourism", city: "Samarkand", venue: "the university campus in Samarkand" },
  { name: "Bozor E-commerce Hack", theme: "commerce", host: "Bozor Commerce", city: "Tashkent", venue: "the Bozor Commerce office in Chilanzar" },
  { name: "Last Mile Logistics Challenge", theme: "commerce", host: "Maydon Logistics", city: "Tashkent", venue: "the Maydon Logistics office in Yunusabad" },
  { name: "Small Business Digital Week", theme: "commerce", host: "Tashkent State University of Economics", city: "Tashkent", venue: "the TSUE campus on Islam Karimov Street" },
  { name: "Social Impact Hackathon", theme: "social", host: "New Uzbekistan University", city: "Tashkent", venue: "New Uzbekistan University on Movarounnahr Street" },
  { name: "Accessibility Hack", theme: "social", host: "Webster University in Tashkent", city: "Tashkent", venue: "the Webster University campus" },
  { name: "Women in Tech Hackathon", theme: "social", host: "Central Asian University", city: "Tashkent", venue: "the Central Asian University campus", audience: "women" },
  { name: "IoT Makers Weekend", theme: "iot", host: "Turin Polytechnic University in Tashkent", city: "Tashkent", venue: "the Turin Polytechnic lab building" },
  { name: "Hardware Hack Samarkand", theme: "iot", host: "Samarkand State University", city: "Samarkand", venue: "the physics faculty labs at Samarkand State University" },
  { name: "Smart Home Challenge", theme: "iot", host: "Zarafshan Cloud", city: "Tashkent", venue: "the Zarafshan Cloud office in Mirzo Ulugbek district" },
];

/** Two challenge paragraphs per theme; each event uses one. */
export const THEME_CHALLENGES: Record<Theme, string[]> = {
  ai: [
    "This year's challenge is practical AI: tools that save someone real time every day. Think document assistants for clinics and notaries, models that understand Uzbek and Russian in the same sentence, or forecasting for small shops. We provide GPU credits and a set of anonymised datasets on the first morning.",
    "We want AI that works for people in Uzbekistan, in their language and on their phones. Teams can pick a track: speech and text in Uzbek, computer vision for industry and agriculture, or assistants that help small businesses answer customers.",
  ],
  fintech: [
    "The challenge is to make money simpler for people and small businesses: budgeting, instalment plans, splitting bills, saving for a goal or paying a supplier without cash. You get a sandbox with test accounts, cards and transfer APIs, so your demo can move (pretend) money for real.",
    "Most payments in Uzbekistan now go through phones, but many people still keep their savings in cash. Build something that earns their trust: transparent loans, savings groups for families, or tools that help a market stall owner keep track of what they earn.",
  ],
  govtech: [
    "Public services are going online fast, and many of them are still hard to use. Pick a service people need (a certificate, a permit, a doctor's appointment, a utility bill) and make it work in three taps. Officials from the participating agencies join the final demo session.",
    "The challenge is to make local government easier to reach: reporting a broken streetlight, tracking a request to the khokimiyat, or finding out which documents a process needs. Open data from several ministries is available to every team.",
  ],
  edtech: [
    "Build tools that help students learn and teachers teach: practice apps for school subjects, ways to give feedback on homework faster, or platforms that connect students in regions with tutors in Tashkent. Teachers from partner schools test the demos on the last day.",
    "Uzbekistan has one of the youngest populations in the region, and schools are short of good digital material in Uzbek. Your task is to build something a student or teacher would open every week, and to show it working with real content.",
  ],
  health: [
    "Clinics and pharmacies still run on paper queues and phone calls. Build something that shortens the wait: appointment booking, medicine availability, reminders for patients with chronic conditions, or dashboards that help a district clinic plan its week. Doctors from partner clinics act as mentors.",
    "The challenge is health that reaches people outside the big cities: telemedicine that works on a slow connection, first-aid guidance in Uzbek, or tools that help nurses track home visits. All data in the provided datasets is synthetic.",
  ],
  game: [
    "A classic game jam: a theme is announced at the opening, and you have the event to make a playable game around it. Any engine, any platform, solo or as a team. Games inspired by Central Asian stories, music and art are especially welcome.",
    "Make a small, finished game rather than a big unfinished one. The theme is revealed on the first morning; the jury plays every entry on the final afternoon, so make sure yours runs in a browser or on an Android phone.",
  ],
  ctf: [
    "A jeopardy-style capture-the-flag competition with tasks in web, cryptography, reverse engineering, forensics and OSINT. Teams also submit a short write-up of their best solution and a fix for one of the vulnerabilities they found. All tasks run on an isolated network; attacking anything outside it disqualifies the team.",
    "Teams attack a purpose-built practice environment, then present how they would defend it. Points come from flags and from the quality of the defensive report. Beginners are welcome: the first hour is a guided warm-up on the basic tools.",
  ],
  agri: [
    "Agriculture employs a quarter of the country's workforce, and water is getting scarcer every year. Build tools for farmers and cooperatives: irrigation planning, crop disease detection from a phone photo, or a better way to sell harvests directly to buyers.",
    "The challenge is getting a fair price and wasting less: from field to warehouse to market. Teams get weather data, regional price data and satellite images for three districts, and agronomists are on hand to answer questions.",
  ],
  climate: [
    "Build something that helps people use less energy and water, or understand the air they breathe. Air quality in Tashkent, water use in households and solar on rooftops are three suggested tracks, each with open data to start from.",
    "The challenge is climate data people can act on: maps, alerts and tools that turn sensor readings and satellite images into decisions for households, schools and city services.",
  ],
  mobility: [
    "Getting around the city should be easy. Teams work with open transport data (routes, stops and anonymised trip counts) to build better trip planners, parking tools, or ways for the city to spot where buses are always late.",
    "The challenge is moving people and goods through the city with less waiting: smarter routes, shared rides for students, or tools that help drivers and dispatchers plan the day.",
  ],
  heritage: [
    "Millions of visitors come to see the Silk Road cities every year. Build tools that help them find their way, understand what they are looking at, and support local guides, craftspeople and guesthouses rather than replace them.",
    "The challenge is to bring heritage sites closer to people: audio guides in several languages, AR views of how a monument looked centuries ago, or booking tools for small family guesthouses.",
  ],
  commerce: [
    "Online shopping is growing fast, but small sellers struggle with listings, delivery and returns. Build tools that help a small business sell online: catalogue builders that work from a phone photo, delivery tracking, or a simple way to accept orders through Telegram.",
    "The challenge is the last mile: getting an order from a warehouse to a doorstep quickly and cheaply. Teams get anonymised order and route data from a real delivery network.",
  ],
  social: [
    "Build something that makes life better for a community that is often overlooked: people with disabilities, older people living alone, families in remote villages, or volunteers who need better tools. Partner NGOs bring real problems and test the demos.",
    "The challenge is tech for social good, built together with the people who will use it. Each track comes with a partner organisation that has a real problem and is ready to try the best solution after the event.",
  ],
  iot: [
    "A hardware hackathon: sensors, microcontrollers and a working prototype by the final demo. Kits with ESP32 boards, sensors and 3D-printing time are provided. Software-only teams are welcome too, as long as something physical blinks, moves or measures.",
    "Build connected devices that solve an everyday problem: smart meters for apartments, sensors for greenhouses, or safety devices for workshops. Teams present a working prototype and the dashboard that goes with it.",
  ],
};

export const FORMAT_PARAGRAPHS = [
  "Teams of up to {max} people. Bring a laptop and an idea, or pick one of the challenge briefs on the first morning. Mentors from {company} and {company2} are on hand throughout, and every team demos to the jury on the final afternoon.",
  "Teams of up to {max}. The event opens with a short briefing, then it's building time until the demos. Mentors from {company} run office hours every few hours, and food and tea are provided the whole time.",
  "You can come with a full team of up to {max} or register alone and find teammates at the opening session. Mentors from {company} and {company2} help with the technical side and with the pitch.",
];

export const PRIZE_PARAGRAPHS = [
  "The top three teams share a prize fund of {prize} million so'm, and the winners get a place in {host}'s incubation programme.",
  "Prizes for the top three teams total {prize} million so'm. The jury also gives a special mention for the best first-time team.",
  "The winning team receives {prize} million so'm and mentoring from {company} for three months after the event.",
];

export const WOMEN_AUDIENCE_PARAGRAPH =
  "Open to women students and recent graduates from any university in Uzbekistan, whatever their field. Mentors are women engineers, designers and founders from {company} and {company2}. Participation is free.";

export const AUDIENCE_PARAGRAPHS = [
  "Open to students from any university in Uzbekistan. Participation is free.",
  "Open to students and recent graduates. You don't need to be a programmer: designers, analysts and future product managers make teams stronger.",
  "Students from all years are welcome. If this is your first hackathon, come to the warm-up session on the first morning.",
  "Registration is free and open to anyone aged 16 and over. Teams from outside {city} can ask the organisers about accommodation.",
];

/** Criteria per theme; an event takes 3 to 5 of them. Names are unique within a list. */
export const THEME_CRITERIA: Record<Theme, string[]> = {
  ai: ["Innovation", "Technical execution", "Use of AI", "Real-world impact", "Presentation"],
  fintech: ["Innovation", "Technical execution", "Security and trust", "Business potential", "Presentation"],
  govtech: ["Impact on citizens", "Ease of use", "Technical execution", "Feasibility", "Presentation"],
  edtech: ["Learning value", "User experience", "Technical execution", "Scalability", "Presentation"],
  health: ["Patient impact", "Technical execution", "Data privacy", "Feasibility", "Presentation"],
  game: ["Fun and gameplay", "Use of theme", "Art and sound", "Technical execution", "Polish"],
  ctf: ["Flags captured", "Write-up quality", "Defensive fixes", "Teamwork", "Presentation"],
  agri: ["Impact for farmers", "Technical execution", "Use of data", "Feasibility", "Presentation"],
  climate: ["Environmental impact", "Use of data", "Technical execution", "Feasibility", "Presentation"],
  mobility: ["Impact on commuters", "Use of data", "Technical execution", "User experience", "Presentation"],
  heritage: ["Visitor experience", "Respect for heritage", "Technical execution", "Business potential", "Presentation"],
  commerce: ["Business potential", "User experience", "Technical execution", "Scalability", "Presentation"],
  social: ["Social impact", "Accessibility", "Technical execution", "Feasibility", "Presentation"],
  iot: ["Working prototype", "Hardware design", "Software and dashboard", "Usefulness", "Presentation"],
};

/** Weight splits that total exactly 100, by number of criteria. */
export const WEIGHT_SPLITS: Record<3 | 4 | 5, number[][]> = {
  3: [[40, 35, 25], [50, 30, 20], [40, 30, 30], [45, 35, 20]],
  4: [[30, 30, 20, 20], [35, 25, 20, 20], [40, 25, 20, 15], [30, 25, 25, 20]],
  5: [[25, 25, 20, 15, 15], [30, 20, 20, 15, 15], [25, 20, 20, 20, 15]],
};

/** Project ideas per theme: `what` goes in the title, `detail` opens the description. */
export const THEME_IDEAS: Record<Theme, { what: string; detail: string }[]> = {
  ai: [
    { what: "an assistant that drafts replies to customer messages", detail: "Small shops get dozens of the same questions on Telegram every day. Our assistant reads the shop's price list and drafts a reply in Uzbek or Russian that the owner approves with one tap." },
    { what: "speech-to-text for Uzbek lectures", detail: "Students record a lecture on their phone and get a searchable transcript with timestamps. The model is fine-tuned on Uzbek speech and handles switching between Uzbek and Russian mid-sentence." },
    { what: "document checker for notary paperwork", detail: "Upload a scan of a contract or a power of attorney and the app highlights missing fields, mismatched names and expired passport numbers before the visit to the notary." },
    { what: "demand forecasting for corner shops", detail: "Shop owners photograph their receipts and get a weekly forecast of what will sell, so they order less of what spoils and more of what runs out." },
    { what: "photo-based defect detection on a production line", detail: "A camera above the conveyor flags damaged packaging in real time. We trained a small vision model that runs on a laptop without a GPU." },
    { what: "CV and job matching for graduates", detail: "Graduates upload a CV and the app suggests internships that match their skills, explaining the gap between the CV and each role in plain words." },
    { what: "a chatbot that answers questions about university rules", detail: "Trained on the student handbook and faculty announcements, it answers questions about deadlines, retakes and scholarships, and links to the paragraph it used." },
    { what: "summaries of long Telegram channels", detail: "Follow fifty channels and read one digest. The bot groups related posts, removes duplicates and summarises each topic in three sentences." },
    { what: "handwriting recognition for school notebooks", detail: "Teachers photograph a stack of homework and get a first pass of marks for arithmetic exercises, with uncertain answers flagged for manual review." },
    { what: "an AI tutor for English speaking practice", detail: "Students talk to the tutor through their phone and get feedback on pronunciation and grammar, with exercises picked for common mistakes Uzbek speakers make." },
  ],
  fintech: [
    { what: "shared savings groups for families", detail: "A digital version of the traditional rotating savings circle: members contribute each month, the app tracks whose turn it is and sends reminders, and everyone sees the same ledger." },
    { what: "instalment plans for small shops", detail: "Electronics and furniture shops can offer instalments without a bank partnership. The shop sets the terms, the buyer gets a schedule and reminders, and late payments are flagged early." },
    { what: "bill splitting for students", detail: "Split rent, groceries and dinner between roommates. Each person pays their share by card, and the app settles the balance at the end of the month." },
    { what: "a budget planner that reads card notifications", detail: "The app reads SMS notifications from the user's bank cards and sorts spending into categories automatically, with a monthly plan that adjusts itself." },
    { what: "invoice tracking for freelancers", detail: "Freelancers create an invoice in under a minute, send a payment link, and see which clients still owe them money." },
    { what: "fraud alerts for card payments", detail: "A scoring model watches card transactions and flags unusual ones, such as a payment from a new city five minutes after one in Tashkent." },
    { what: "a cash-flow dashboard for market stalls", detail: "Stall owners enter sales by voice at the end of the day, and the dashboard shows weekly profit, best-selling goods and what to restock." },
    { what: "transparent microloans with clear terms", detail: "Every loan offer shows the full cost in so'm, not just a percentage, and the borrower can compare offers side by side before signing." },
    { what: "a savings goal app for teenagers", detail: "Parents set up a goal with their child, top it up by card, and the app teaches basic money skills with short weekly challenges." },
    { what: "supplier payments without cash", detail: "Restaurants pay their suppliers through a QR code at delivery, and both sides get a receipt that goes straight into their accounting." },
  ],
  govtech: [
    { what: "reporting broken streetlights and potholes", detail: "Residents take a photo, the app adds the location and sends the report to the right district service. Everyone can follow the status of their report on a public map." },
    { what: "a checklist for getting official documents", detail: "Choose what you need (a passport, a birth certificate, a property certificate) and get a personalised list of documents, offices and fees, with reminders before each step." },
    { what: "tracking requests to the khokimiyat", detail: "Every request gets a number and a status page, so residents don't need to call or visit to learn whether anything happened." },
    { what: "online queue for public service centres", detail: "Book a time slot at the nearest public service centre and get a reminder an hour before. The centre sees the day's load in advance." },
    { what: "a utility bill assistant", detail: "All of a household's utility bills in one place, with usage graphs and alerts when a bill looks unusually high." },
    { what: "a mahalla notice board", detail: "Mahalla committees post announcements, meetings and help requests, and residents get them as Telegram messages instead of paper notices." },
    { what: "open budget explorer for districts", detail: "A searchable view of district budgets that shows where money goes, in plain language and with charts residents can share." },
    { what: "simple forms for older residents", detail: "A redesign of three common public service forms with large text, voice input and step-by-step help, tested with residents over 60." },
  ],
  edtech: [
    { what: "practice tests for university entrance exams", detail: "Thousands of past-style questions in maths, physics and languages, with explanations for every answer and a plan that focuses on weak topics." },
    { what: "faster homework feedback for teachers", detail: "Teachers mark homework from a phone, reuse common comments with one tap, and parents see the feedback the same evening." },
    { what: "connecting regional students with tutors", detail: "Students from the regions book short online lessons with university students in Tashkent, paid per lesson and rated afterwards." },
    { what: "a coding course in Uzbek for school students", detail: "Short lessons in Uzbek with exercises that run in the browser. The first module teaches Python through small games." },
    { what: "attendance and grades in one app", detail: "Teachers take attendance in ten seconds, grades sync to the school's journal, and students see their progress in one place." },
    { what: "flashcards that follow the school curriculum", detail: "Spaced-repetition flashcards built from the official textbooks, with audio for language subjects and offline mode for the bus." },
    { what: "a library catalogue for school libraries", detail: "Librarians scan a book's barcode to add it, students search the catalogue from their phones and reserve a book for pickup." },
    { what: "group project planning for students", detail: "Split a course project into tasks, assign them, and let the teacher see who did what, so group grades are fair." },
    { what: "interactive physics simulations", detail: "Browser-based simulations for twelve school physics topics, with a worksheet for each so teachers can use them in class right away." },
  ],
  health: [
    { what: "appointment booking for district clinics", detail: "Patients pick a doctor and a time slot online instead of queuing at 7 am. Clinics see the day's schedule and can send a message if a doctor is away." },
    { what: "finding medicine in nearby pharmacies", detail: "Search for a medicine and see which pharmacies nearby have it in stock and at what price, updated from the pharmacies' own inventory systems." },
    { what: "reminders for patients with diabetes", detail: "Daily reminders for medication and glucose checks, a simple log the patient can show their doctor, and alerts to a family member when readings are high." },
    { what: "telemedicine for slow connections", detail: "Video calls drop on a weak connection, so our consultation app falls back to voice and photos, and keeps a written summary for the patient." },
    { what: "home visit planning for nurses", detail: "Nurses get an optimised route for the day's home visits, record each visit on their phone, and the clinic sees coverage across the district." },
    { what: "first-aid guidance in Uzbek", detail: "Step-by-step first-aid instructions with pictures and voice, which work offline and call the emergency number with one tap." },
    { what: "a mood and sleep journal for students", detail: "A short daily check-in on mood, sleep and stress, with weekly trends and links to the university's counselling service when it might help." },
    { what: "vaccination records for families", detail: "Every child's vaccination history in one place, with reminders before each scheduled dose and a printable certificate." },
    { what: "a dashboard for clinic bed capacity", detail: "Hospital staff update bed availability in a few taps, and the regional health office sees capacity across all clinics in real time." },
  ],
  game: [
    { what: "a puzzle game set in old Bukhara", detail: "Guide a water carrier through the old city's alleys, opening canals and moving carts to bring water to every courtyard before sunset." },
    { what: "a rhythm game with Uzbek folk music", detail: "Tap along to doira rhythms and dutar melodies recorded with local musicians. Each level teaches a traditional rhythm pattern." },
    { what: "a caravan trading strategy game", detail: "Lead a caravan along the Silk Road, buy low in one city and sell high in the next, while managing water, camels and the weather." },
    { what: "a platformer about a lost kite", detail: "A short platformer about chasing a kite across the rooftops of a mahalla, with hand-drawn art and a soundtrack recorded during the jam." },
    { what: "a cooperative cooking game", detail: "Two players cook plov for a wedding against the clock, passing ingredients across a busy kitchen." },
    { what: "a word game for learning Uzbek", detail: "Build Uzbek words from falling letters. Each correct word adds a picture card to your collection, with audio pronunciation." },
    { what: "a space shooter with one-button controls", detail: "A one-button arcade game designed to be played with a single tap, so anyone can pick it up in seconds." },
    { what: "a mystery game in a museum at night", detail: "Explore a museum after closing time, examine exhibits and solve who moved the ancient manuscript, using clues hidden in real artefacts." },
    { what: "a city-building game around an oasis", detail: "Grow a settlement around a desert oasis, balancing water use, farms and trade, with every decision affecting the next generation." },
    { what: "a stealth game in a Samarkand bazaar", detail: "Sneak between stalls of dried fruit and spices to return a stolen carpet before the bazaar closes, hiding in crowds and behind carts." },
    { what: "a racing game on the Tashkent ring road", detail: "Arcade racing through a stylised Tashkent at night, with routes past the TV tower and Amir Temur Square and shortcuts through mahallas." },
    { what: "a tower defence game at a fortress gate", detail: "Defend the gates of an old fortress with archers, walls and traps, wave after wave, with each tower based on a real piece of local architecture." },
    { what: "a deck-building game about Silk Road traders", detail: "Build a deck of goods, camels and contacts, then trade your way from Kashgar to Bukhara before your rivals do." },
    { what: "an endless runner through the Tashkent metro", detail: "Run through metro stations modelled on the real ones, with their chandeliers and mosaics, dodging closing doors and rush-hour crowds." },
    { what: "a point-and-click adventure in Itchan Kala", detail: "Explore the walled old town of Khiva, talk to its residents and solve the puzzle of a missing minaret tile." },
    { what: "a co-op puzzle game for two phones", detail: "Two players see different halves of the same room on their own phones and have to talk to each other to escape." },
    { what: "a farming game with a real Uzbek calendar", detail: "Plant, water and harvest crops by the real seasons of the Fergana Valley, and sell at the weekly market in time for Navruz." },
    { what: "a falconry game in the mountains", detail: "Train a falcon above the Chimgan mountains: read the wind, time your release and bring it back safely before dusk." },
    { what: "a music game with a virtual doira", detail: "Play the doira on your phone's touchscreen, follow traditional rhythms and unlock new songs recorded with local musicians." },
    { what: "a physics puzzle about building bridges", detail: "Build wooden bridges across mountain rivers with a limited budget, and watch a caravan test every one of them." },
    { what: "a pixel-art adventure about a school trip", detail: "A short story game about a class trip to Samarkand, told in pixel art, where every choice changes how the day ends." },
    { what: "an arcade game about catching falling apricots", detail: "Catch ripe apricots before they hit the ground in a Fergana orchard. Simple to learn, hard to master, and made for one hand." },
    { what: "a strategy game about running a teahouse", detail: "Run a chaikhana: buy tea and bread, seat guests, keep the samovar hot and grow from a single table to a busy teahouse." },
    { what: "a hidden-object game in a carpet workshop", detail: "Find patterns, tools and threads hidden in a Bukhara carpet workshop, and learn what each traditional motif means." },
    { what: "a multiplayer quiz about Uzbekistan", detail: "Up to eight players answer questions about cities, food, history and music on their phones, with the host screen on a projector." },
    { what: "a sailing game on the old Aral Sea", detail: "Sail the Aral Sea as it was in the 1960s, then return to the same places today. A short game about change, made with care." },
    { what: "a horror game in an abandoned observatory", detail: "Explore an abandoned observatory at night with only a lantern, and piece together what the last astronomer discovered." },
    { what: "a sports game based on kupkari", detail: "A fast, cartoonish take on the traditional horseback game, with simple controls and matches that last two minutes." },
    { what: "a roguelike in desert ruins", detail: "Every run through the ruins is different. Collect relics, avoid sandstorms and decide whether to dig deeper or head home." },
    { what: "a calm game about restoring tiles", detail: "Restore the blue tilework of an old madrasa piece by piece, matching colours and patterns. No timer, no score, just patterns." },
    { what: "an educational game about the solar system", detail: "Fly a small probe from planet to planet, collect facts and answer short quizzes, inspired by Ulugh Beg's star catalogue." },
  
    { what: "a snowboarding game on Amirsoy slopes", detail: "Carve down mountain slopes, land tricks and race friends' ghost runs, with tracks modelled on the resort's real runs." },
    { what: "a card game about Navruz traditions", detail: "Collect cards for sumalak, kok somsa and spring games, and complete the festival table before the other players." },
    { what: "a top-down shooter in a sci-fi Samarkand", detail: "Defend a future Samarkand where the domes are solar collectors, with twin-stick controls that also work on a gamepad." },
    { what: "a typing game for learning Latin-script Uzbek", detail: "Type words before they reach the city gates. The levels follow the Latin alphabet, letter by letter, with sounds for each word." },
    { what: "a management game about a mahalla market", detail: "Plan the stalls of a small weekly market, keep sellers and buyers happy and decide where the new tea stall should go." },
    { what: "a racing game with donkey carts", detail: "A light-hearted race through village lanes with carts full of melons, where every bump costs you part of the load." },
    { what: "a gravity puzzle in a space station", detail: "Flip gravity to guide a small robot through a space station, one room at a time, with 30 hand-made levels." },
    { what: "a memory game with suzani patterns", detail: "Match pairs of embroidered suzani motifs, with each pair explaining the meaning of the pattern once you find it." },
    { what: "a survival game in the Kyzylkum desert", detail: "Find water, shade and a way home across the Kyzylkum desert, with a day and night cycle that changes what is safe." },
    { what: "a stealth game in a museum heist", detail: "Return stolen artefacts to a museum without being seen, planning your route around guards, cameras and creaky floors." },
    { what: "a two-player boxing game", detail: "A quick local multiplayer boxing game for one keyboard, with simple controls and rounds that last thirty seconds." },
    { what: "a puzzle game about drawing lines of light", detail: "Bend beams of light with mirrors and prisms to light every lamp in a room, inspired by the patterns of girih tiles." },
  ],
  ctf: [
    { what: "write-up and fixes for the web tasks", detail: "We solved six of the eight web tasks, including the SQL injection in the login form and the insecure file upload. The write-up explains each exploit and the fix we would apply." },
    { what: "cryptography solutions and a key-handling guide", detail: "Our solutions for the cryptography tasks, plus a short guide on the key-handling mistakes behind them and how to avoid them in production code." },
    { what: "forensics report on the compromised server", detail: "We reconstructed the attacker's steps from the logs and disk image, found the persistence mechanism, and wrote a timeline of the incident." },
    { what: "OSINT task solutions and a privacy checklist", detail: "Solutions for the OSINT tasks and a checklist that shows how much personal information can be found from a few public social media posts." },
    { what: "reverse-engineering notes for the binary tasks", detail: "Annotated disassembly for the three binary tasks, with the flags and a description of the checks we bypassed." },
    { what: "a hardening script for the practice environment", detail: "A script that fixes the misconfigurations we exploited during the competition, tested by running our own exploits again afterwards." },
    { what: "network traffic analysis and detection rules", detail: "We captured traffic during the attack phase and wrote detection rules that would have caught four of the five attacks we saw." },
  ],
  agri: [
    { what: "irrigation planning from weather forecasts", detail: "Farmers enter their crops and field size, and the app suggests when and how much to water based on the local forecast and soil type." },
    { what: "crop disease detection from a phone photo", detail: "Photograph a leaf and the app identifies common cotton and wheat diseases, with treatment advice reviewed by an agronomist." },
    { what: "selling harvests directly to buyers", detail: "Farmers list their harvest with photos and a price, and buyers from cities and export companies make offers directly, without middlemen." },
    { what: "a cold-storage marketplace", detail: "Find free space in cold storage warehouses nearby and book it by the tonne, so less fruit spoils after harvest." },
    { what: "soil moisture sensors with SMS alerts", detail: "Cheap sensors in the field send readings over the mobile network, and the farmer gets an SMS when a field needs water." },
    { what: "price tracking for regional markets", detail: "Daily prices for twenty products across regional markets, so farmers know where to sell and when to wait." },
    { what: "livestock health records", detail: "Vets and farmers keep vaccination and treatment records for each animal, with reminders and a QR tag on the animal's ear." },
    { what: "a cooperative planning tool for farmers", detail: "Neighbouring farmers share machinery and plan who uses the tractor when, with costs split automatically." },
  ],
  climate: [
    { what: "an air quality map for Tashkent", detail: "Readings from public sensors on one map, with hourly forecasts and alerts for people with asthma when the air gets worse." },
    { what: "household water use tracking", detail: "A smart meter reader and an app that shows a family how much water they use, compared to similar households, with tips that make a difference." },
    { what: "a rooftop solar calculator", detail: "Enter an address and see how much a rooftop solar system would cost, how much it would produce, and how long until it pays for itself." },
    { what: "recycling points and pickup scheduling", detail: "Find the nearest recycling point for each type of waste, or schedule a pickup for large items, with a points programme for regular users." },
    { what: "heat alerts for outdoor workers", detail: "Employers get heat-stress alerts for their sites based on the forecast, with a schedule of breaks and water stops for the day." },
    { what: "energy dashboards for schools", detail: "Schools see their electricity and gas use each week, and students run a competition to cut waste between classes." },
    { what: "satellite maps of water levels", detail: "Satellite images turned into a simple map of reservoir and lake levels over the last ten years, with a monthly update." },
    { what: "a tree planting tracker", detail: "Volunteers record every tree they plant with a photo and location, and the city sees which trees survived their first summer." },
  ],
  mobility: [
    { what: "a bus arrival predictor", detail: "Using anonymised trip data, we predict bus arrival times at each stop and show them in a Telegram bot, with alerts when a bus is running late." },
    { what: "a parking finder for the city centre", detail: "Drivers see free parking spots near their destination, based on reports from other drivers and data from paid parking zones." },
    { what: "shared rides for students", detail: "Students going to the same campus from the same district share taxis, with the fare split automatically and safety features for late trips." },
    { what: "a delay map for public transport", detail: "A map for the city transport department that shows where buses are always late and at what times, so routes can be adjusted." },
    { what: "route planning for delivery drivers", detail: "Drivers get an optimised route for the day's deliveries, updated when a new order comes in or traffic changes." },
    { what: "accessible routes for wheelchair users", detail: "A route planner that avoids stairs and steep kerbs, built from accessibility reports collected by volunteers." },
    { what: "bike and scooter lane planning", detail: "Trip data and resident surveys combined into a map of where new bike lanes would help the most people." },
    { what: "metro crowding forecasts", detail: "Forecasts of how crowded each metro station will be in the next hour, so commuters can choose a quieter time." },
  ],
  heritage: [
    { what: "an audio guide for the Registan", detail: "A multilingual audio guide that plays the right story when you stand in front of each madrasa, recorded with local historians." },
    { what: "AR views of monuments as they once were", detail: "Point your phone at a monument and see a reconstruction of how it looked in the 15th century, based on archival drawings." },
    { what: "booking for family guesthouses", detail: "Small guesthouses list their rooms in a few minutes and accept bookings online, without paying large commissions." },
    { what: "a marketplace for local craftspeople", detail: "Visitors find workshops for ceramics, silk and woodcarving, book a visit, and buy directly from the craftsperson." },
    { what: "walking routes through the old city", detail: "Themed walking routes with offline maps, short stories at each stop, and recommendations for local food along the way." },
    { what: "a digital archive of old photographs", detail: "Residents upload old family photos of their city, and the archive places them on a map next to the same street today." },
    { what: "crowd forecasts for heritage sites", detail: "See when each site is least busy and plan a visit around it. Site managers get forecasts to plan staff." },
    { what: "a translator for guides and visitors", detail: "Guides speak Uzbek or Russian, and visitors hear the translation in their own language through their phones." },
    { what: "an offline map of Bukhara's old town", detail: "A map that works without a connection, with every madrasa, caravanserai and trading dome marked and a short story for each." },
    { what: "a booking app for craft workshops", detail: "Visitors book a two-hour pottery, silk or embroidery class with a local master, and pay online before they arrive." },
    { what: "QR stories for monuments", detail: "Small QR plaques at each monument open a short story in five languages, written with historians and read by local actors." },
    { what: "a guide marketplace for licensed guides", detail: "Visitors compare licensed guides by language, price and reviews, and book a tour for the next morning in a few taps." },
    { what: "a 3D scan archive of carved doors", detail: "We scanned carved wooden doors in the old town and published them as 3D models, so restorers and students can study them." },
    { what: "accessible routes for heritage sites", detail: "Routes through each site that avoid stairs and steep paths, with notes on ramps, benches and shade, tested with wheelchair users." },
    { what: "a food trail through the old city", detail: "A walking food trail with stops for samsa, plov and green tea, and short notes about where each dish comes from." },
    { what: "souvenir authenticity checks", detail: "Craftspeople register their work with a photo and a code, so visitors can check that a suzani or a ceramic plate is handmade." },
    { what: "a heritage quiz for school groups", detail: "Teachers run a quiz trail around a heritage site, and students answer questions on their phones as they walk." },
    { what: "a visitor feedback tool for site managers", detail: "Visitors rate cleanliness, signs and guides in one tap, and site managers see what to fix first on a weekly report." },
    { what: "train and taxi connections for tourists", detail: "Plan a day trip between Samarkand, Bukhara and Khiva with train times, taxi prices and the walk from each station." },
    { what: "audio stories from local elders", detail: "Recorded memories of older residents about their streets and crafts, played when a visitor walks past the place they describe." },
  
  ],
  commerce: [
    { what: "a catalogue builder from phone photos", detail: "Sellers photograph their products, and the app removes the background, suggests a title and price, and publishes the listing." },
    { what: "Telegram ordering for small shops", detail: "Customers order through a Telegram bot with a catalogue and cart, and the shop gets each order as a clear message with the delivery address." },
    { what: "delivery tracking for customers", detail: "Customers see where their order is on a map and get a message when the courier is ten minutes away." },
    { what: "returns made simple", detail: "A returns flow for online shops: the customer picks a reason, prints nothing, and the courier collects the item on the next delivery round." },
    { what: "stock management for small warehouses", detail: "Scan items in and out with a phone camera, see stock levels in real time and get alerts before anything runs out." },
    { what: "pickup points in mahallas", detail: "Local shops become pickup points for online orders, earn a small fee, and customers collect parcels near home." },
    { what: "a loyalty programme for neighbourhood shops", detail: "Shops share one loyalty card, customers collect points by showing a QR code, and owners see who their regular customers are." },
    { what: "price comparison for groceries", detail: "Compare grocery prices across supermarkets near you, built from receipts that users photograph." },
  ],
  social: [
    { what: "volunteer matching for NGOs", detail: "NGOs post tasks with a time and place, volunteers sign up with one tap, and both sides see hours volunteered over time." },
    { what: "a screen reader-friendly news app", detail: "News in Uzbek with full screen reader support, adjustable text size and audio versions of every article." },
    { what: "help requests for older people living alone", detail: "Older residents ask for help with shopping or a doctor's visit by phone call, and nearby volunteers pick up the request." },
    { what: "sign language video dictionary", detail: "A searchable dictionary of Uzbek sign language with videos recorded together with a local deaf community organisation." },
    { what: "a mentorship platform for girls in tech", detail: "School and university students find a mentor working in tech, book monthly calls and follow a shared learning plan." },
    { what: "donations with full transparency", detail: "Every donation is tracked from donor to purchase, with receipts and photos posted by the charity." },
    { what: "job listings for people with disabilities", detail: "Employers post accessible job listings and describe the workplace in detail, so applicants know what to expect before they apply." },
    { what: "a food sharing app for surplus food", detail: "Bakeries and restaurants post surplus food at the end of the day, and charities or families collect it before it goes to waste." },
  ],
  iot: [
    { what: "a smart water meter for apartments", detail: "A clip-on sensor reads an existing water meter and sends usage to an app, with leak alerts when water runs at night." },
    { what: "greenhouse climate control", detail: "Sensors measure temperature and humidity, and the controller opens vents and turns on drip irrigation automatically." },
    { what: "a gas leak detector with phone alerts", detail: "A small detector for kitchens that sounds an alarm and sends a message to family members when it detects a gas leak." },
    { what: "workshop safety sensors", detail: "Sensors on workshop machines detect when a guard is open or a hand is too close, and stop the machine." },
    { what: "a classroom air quality monitor", detail: "A CO2 monitor with a traffic-light display that tells the teacher when to open the windows, with weekly reports for the school." },
    { what: "smart bins that report when they are full", detail: "Ultrasonic sensors in public bins report fill levels, and the collection route is planned around the full ones." },
    { what: "energy monitoring for small shops", detail: "A clamp sensor on the main cable shows a shop owner which appliances use the most electricity and when." },
    { what: "a parcel locker prototype", detail: "A locker with a keypad and a phone app: the courier drops the parcel, and the customer opens the door with a one-time code." },
    { what: "a cold-chain tracker for pharmacies", detail: "A small sensor in each medicine fridge logs the temperature and sends an alert before vaccines or insulin get too warm." },
    { what: "a smart lock for dormitory rooms", detail: "Students open their dormitory room with a phone or a card, and the dormitory office can grant guest access for a day." },
    { what: "a beehive monitor for beekeepers", detail: "Weight, temperature and sound sensors in the hive tell a beekeeper when the colony is healthy and when to harvest." },
    { what: "a noise monitor for apartment blocks", detail: "Sensors in stairwells measure noise at night, and the building chat gets a polite reminder when it is too loud." },
    { what: "an elevator fault reporter", detail: "A sensor kit for old elevators that detects stops between floors and door faults, and reports them to the maintenance company." },
    { what: "a solar panel cleaning reminder", detail: "Light sensors next to each panel spot when dust is cutting output, so the owner knows exactly when to clean." },
    { what: "a fall detector for older people", detail: "A small wearable notices a fall and calls a family member, with a button to cancel the alarm if everything is fine." },
    { what: "a bus stop arrival display", detail: "A low-cost e-ink display for bus stops that shows when the next buses will arrive, powered by a small solar panel." },
    { what: "smart irrigation valves for courtyards", detail: "Valves on courtyard garden hoses open at the right time of day and skip watering when the soil is already moist." },
    { what: "a fridge door alarm for small shops", detail: "A sensor beeps and sends a message when a shop's drinks fridge is left open, saving electricity in the summer." },
  
  ],
};

/** CTF write-ups: category × deliverable, so every team's title differs. */
export const CTF_CATEGORIES = [
  "web", "cryptography", "forensics", "OSINT", "reverse engineering",
  "binary exploitation", "mobile", "cloud", "network",
] as const;
export const CTF_DELIVERABLES = [
  { what: "{cat} write-up with fixes", detail: "Solutions for the {cat} tasks we solved, each with the vulnerability behind it and the patch we would ship." },
  { what: "{cat} detection rules", detail: "For every {cat} task we solved, a detection rule or log query that would have caught the attack in production." },
  { what: "{cat} hardening checklist", detail: "A short checklist developers can follow to avoid the {cat} mistakes we exploited, with an example for each item." },
  { what: "a beginner's guide to the {cat} tasks", detail: "Step-by-step walkthroughs of the {cat} tasks for first-time players, written so a student can follow them without CTF experience." },
];

/**
 * When an event has more submissions than its theme has ideas, it draws from
 * these related themes next, so no idea repeats within an event.
 */
export const RELATED_THEMES: Record<Theme, Theme[]> = {
  ai: ["edtech", "health", "commerce", "govtech"],
  fintech: ["commerce", "social", "govtech", "ai"],
  govtech: ["mobility", "social", "climate", "edtech"],
  edtech: ["social", "ai", "govtech", "health"],
  health: ["social", "ai", "iot", "climate"],
  game: [],
  ctf: [],
  agri: ["climate", "iot", "commerce", "fintech"],
  climate: ["iot", "agri", "mobility", "govtech"],
  mobility: ["govtech", "commerce", "climate", "heritage"],
  heritage: ["commerce", "mobility", "edtech"],
  commerce: ["fintech", "mobility", "agri", "ai"],
  social: ["health", "edtech", "govtech", "ai"],
  iot: ["climate", "agri", "mobility"],
};

/**
 * Product names for project titles ("Navbat: online queue for …"). An Uzbek
 * word is only used where its meaning fits the idea's theme; `null` fits any.
 */
export const PRODUCTS: { name: string; themes: Theme[] | null }[] = [
  { name: "Navbat", themes: ["health", "govtech"] }, // queue
  { name: "Hisob", themes: ["fintech", "commerce"] }, // account
  { name: "Daftar", themes: ["edtech"] }, // notebook
  { name: "Bozorchi", themes: ["commerce", "agri"] }, // shopper
  { name: "Ustoz", themes: ["edtech", "ai"] }, // teacher
  { name: "Sog'lom", themes: ["health"] }, // healthy
  { name: "Yordam", themes: ["social", "health", "govtech"] }, // help
  { name: "Kuzat", themes: ["iot", "climate", "mobility", "ctf"] }, // watch
  { name: "Sayyoh", themes: ["heritage"] }, // traveller
  { name: "Dala", themes: ["agri"] }, // field
  { name: "Suv", themes: ["agri", "climate", "iot"] }, // water
  { name: "Quyosh", themes: ["climate", "iot"] }, // sun
  { name: "Ko'prik", themes: null }, // bridge
  { name: "Manzil", themes: ["mobility", "commerce", "heritage"] }, // address
  { name: "Taqvim", themes: ["edtech", "health", "govtech"] }, // calendar
  { name: "Bilim", themes: ["edtech", "ai"] }, // knowledge
  { name: "Kitobxon", themes: ["edtech"] }, // reader
  { name: "Hamyon", themes: ["fintech"] }, // wallet
  { name: "Tanga", themes: ["fintech", "game"] }, // coin
  { name: "Kassa", themes: ["fintech", "commerce"] }, // till
  { name: "Ombor", themes: ["commerce", "agri"] }, // warehouse
  { name: "Karvon", themes: ["game", "heritage", "commerce", "mobility"] }, // caravan
  { name: "Chorsu", themes: ["commerce", "heritage"] }, // Tashkent's bazaar
  { name: "Lochin", themes: null }, // falcon
  { name: "Burgut", themes: null }, // eagle
  { name: "Oqim", themes: null }, // stream
  { name: "Mezon", themes: null }, // measure
  { name: "Nishon", themes: ["ctf", "game"] }, // target
  { name: "Ziyo", themes: ["edtech"] }, // enlightenment
  { name: "Tong", themes: null }, // dawn
  { name: "Shaffof", themes: ["fintech", "govtech", "social"] }, // transparent
  { name: "Ovoz", themes: ["ai", "govtech", "social"] }, // voice
  { name: "Raqam", themes: null }, // digit
  { name: "Hamkor", themes: null }, // partner
  { name: "Qadam", themes: ["health", "edtech", "mobility"] }, // step
  { name: "Orzu", themes: ["social", "game"] }, // dream
  { name: "Ishonch", themes: ["fintech", "social", "ctf"] }, // trust
  { name: "Bekat", themes: ["mobility"] }, // stop
  { name: "Yo'nalish", themes: ["mobility", "heritage"] }, // direction
  { name: "Samarqand", themes: ["heritage"] },
  { name: "Ipak", themes: ["heritage", "commerce"] }, // silk
  { name: "Yulduz", themes: null }, // star
  { name: "Shamol", themes: ["climate"] }, // wind
  { name: "Bahor", themes: ["climate", "agri"] }, // spring
  { name: "Gulzor", themes: ["agri", "climate"] }, // flower garden
  { name: "Mehr", themes: ["social", "health"] }, // kindness
  { name: "Tayanch", themes: ["social", "health"] }, // support
  { name: "Chiroq", themes: ["climate", "iot"] }, // lamp
  { name: "Qalqon", themes: ["ctf"] }, // shield
  { name: "Uyim", themes: ["iot", "commerce"] }, // my home
  { name: "Safar", themes: ["mobility", "heritage"] }, // trip
  { name: "Mahalla+", themes: ["govtech", "social"] },
  { name: "Darvoza", themes: ["govtech", "ctf", "heritage"] }, // gate
  { name: "Minor", themes: ["heritage"] }, // minaret
  { name: "Bog'bon", themes: ["agri"] }, // gardener
  { name: "Tez", themes: ["commerce", "mobility"] }, // fast
  { name: "Aqlli", themes: ["iot", "ai"] }, // smart
  { name: "Birga", themes: ["social", "fintech"] }, // together
  { name: "Kelajak", themes: null }, // future
  { name: "Sifat", themes: null }, // quality
  ...[
    "Pulse", "Atlas", "Compass", "Beacon", "Mosaic", "Lantern", "Relay",
    "Harvest", "Orbit", "Vertex", "Kite", "Prism", "Anchor", "Canvas",
    "Ledger", "Sprout", "Bridge", "Echo", "Nimbus", "Tandem", "Waypoint",
    "Meridian", "Keystone", "Spark", "Tumaris", "Nova", "Summit", "Signal",
    "Fable", "Quest", "Pixel", "Arcade", "Nomad", "Zenith", "Cipher",
  ].map((name) => ({ name, themes: null })),
];

/** Team names. Combined with ADJECTIVES × NOUNS when an event needs more. */
export const TEAM_NAMES = [
  "Null Pointers", "Byte Club", "Code Caravan", "Silk Stack", "Blue Domes",
  "Registan Runtime", "Async Owls", "Plov Protocol", "Ctrl Alt Elite",
  "The Debuggers", "Merge Conflict", "Hello World", "Pixel Nomads",
  "Data Dervishes", "Green Light", "Team Lochin", "Team Burgut", "Night Shift",
  "Open Source Oasis", "Lambda Lions", "Stack Samarkand", "Bukhara Bytes",
  "Tashkent Tigers", "Commit Crew", "Deploy Friday", "Hotfix Heroes",
  "Kernel Panic", "Binary Bazaar", "Cloud Caravan", "Neural Nomads",
  "Ping Pong", "Rubber Ducks", "Semicolons", "Exception Handlers",
  "Bit Shifters", "Infinite Loop", "Sudo Make", "Hash Map", "Dark Mode",
  "Two Pizza Team", "Last Commit", "Pull Request", "Second Breakfast",
  "Unit Testers", "Green Tea Coders", "Sunrise Studio", "Golden Ratio",
  "Overclocked", "Root Access", "Cache Hit", "Bug Hunters", "Team Ziyo",
  "Team Mezon", "Team Orbit", "Chorsu Hackers", "Zarafshan Devs",
];
export const TEAM_ADJECTIVES = [
  "Silk Road", "Blue Dome", "Midnight", "Pixel", "Quantum", "Desert",
  "Mountain", "Golden", "Swift", "Bright", "Green", "Iron", "Hidden",
  "Open", "Steppe", "Cosmic", "Northern", "Clever", "Rapid",
];
export const TEAM_NOUNS = [
  "Owls", "Nomads", "Coders", "Builders", "Falcons", "Lambdas", "Makers",
  "Hackers", "Bytes", "Pioneers", "Engineers", "Caravans", "Leopards",
  "Foxes", "Sprinters", "Architects",
];

export const DEMO_STATUS_LINES = [
  "The demo covers sign-up, the main flow and a simple admin view.",
  "We tested it with {n} students from our faculty during the event.",
  "Next we want to run a two-week pilot with real users.",
  "The prototype works end to end; payments and notifications are mocked.",
  "Everything shown in the demo is live, running on a small cloud server.",
  "We interviewed {n} potential users before writing any code.",
];
