<!-- history of south america timeline -->

create a timeline for the history of south america, where each star is a key time period, with its mission being key events in that period. make the timeline from discovery to modern time. i want to it to be a way for me to learn the history of south america

<!-- refine star test -->

can you split these missions into three standalone stars (each with their own missions). currently it feels like you are cramming too much into one star.

<!-- refine mission test -->

can you split this mission into three standalone missions each with their own descriptive steps. currently it feels like you are cramming too much into one mission and the steps arent descriptive enough

<!-- podcast -->

create a course that teaches year 7-8 (aged 10-13) students in the Cook Islands to create a podcast interviewing an elder. we will also get them to video record the podcast. we want to teach the students effective communication, critial literacy and persuasive storytelling. the course should cover 12 weeks, 4 days per week, 3 hours per day. Attached is a json of a past iteration that we liked but it didnt cover video recording and editing.

<!-- refine -->

refine the whole galaxy to be more descriptive. the intros, outros and steps are not descriptive enough. remember this is the learning material, we want to impart as much knowledge as possible

<!-- basic html and css -->

an introduction course to web development covering the three codes that make up the web, html, css and js. in it students will learn the basics, using glitch.com (so it can host their sites live). and the mini web app they will build is a fishing of the cook islands database, where the home page is are image buttons of each fish and when you click on a fish it takes you to a page about that fish. students will learn basic html, css and navigation

<!-- ocean waves -->

map the science of how ocean waves reach our shores, cover energy transfer, starting from the sun, to pressure systems, to wind, to waves. tailor it to 11 and 12 year old students in the cook islands.

<!-- ultrasonic water tank -->

i want to create an iot system that uses a HC-SR04 ultrasonic sensor connected to a ESP8266 NODEMCUv1 wifi board to measure the height of the water level in a water tank, then send that to node-red on an android phone that the nodemcu is connected to via wifi hotspot, then node-red will send a whatsapp message to a person every morning with the water tank level in %. we will also save data to firebase and make the node-red dashboard accessible remotely using free ngrok. the system will be powered by 4 x 18650 batties in a parallel battery holder and a 20w solar panel and a tp4056

<!--  refine -->

i dont like the sequence.
we should do sensor to board on usb power first.
then to node red
then firebase
then node red dashoard
then solar battery
the whatsapp daily notification

<!-- physics for resilince -->

middle school physics, biology, and chemistry for remote island resilience.
Targeted at school aged students.
12 week long course. 4 lessons per week.
Project based.
Basic understanding, all beginners.

<!-- ai character generation -->

create a mini course on how to generate lip-sycned videos of ai characters talking.
the workflow is this:

- generate an image of a character using chatgpt and download
- generate a voice with eleven labs and download
- convert the downloaded eleven labs .mp3 file to .wav using audacity (explain how to download audacity)
- use hunyuan to generate the lip-sync video by uploading the .wav audio and image and then generate.
  -- its important to use this link (https://hunyuan.tencent.com/modelSquare/home/play?modelId=126) to get to the right model and ui.
  -- the website is in chinese so in chrome the have to click the translate icon at the end of the url bar to change the language to English
  -- the first ui they are presented with is the login method (WeChat, QQ, Email), have them select Email
  -- they will need to enter their email address, then click the "Get verification code" link, then click the blue agree button to accept service agreements, then go to their email and copy the code from the email that was sent (the email might be in Spam folder), coming back to the sign in screen, and pasting the code into the field below the email address, and then click log in
  -- once logged in they will need to change the language back to english, select the "Upload Audio" option (instead of the default "Text reading" option)
  -- now they can upload the audio file, and upload the image, and once those two files are uploaded the can click Generate Now
  -- It will take a few minutes to generate, then can then click on the video to watch it, and click the 3 dots (bottom right corner), and Download, to download their generated lip-sync video from ai generated image and ai generated audio

clarifying response

['Who is the target learner (age, technical skill level, experience with web apps/audio tools)?', 'Which operating system(s) should the Audacity down…→WAV steps cover (Windows, macOS, Linux, or all)?', 'Do you want the guide to include account sign-up s…sume learners already have accounts and an email?', 'When you say “generate an image of a character usi…rred visual style (cartoon, stylized, photoreal).', 'Do you want detailed Eleven Labs guidance (choosin…e) or just a simple ‘generate and download’ flow?', 'Should I include short legal/ethics/use guidance (…l use/licensing) for generated voices and images?', 'How long/compact should this mini-course be (e.g.,…3–5 planets, or a slightly deeper 2–3 hour path)?']

question answers:

1. school aged kids, i want to test it with my 10 year old niece
2. windows
3. please step them through creating the accounts, and stepping through the ui steps to do some of the generations (eg. for eleven labs -> creative platform -> create a voice -> Voice Design -> Prompt & Text to preview -> Generate voice)
4. assume the already have a chatgpt account and access to the chatgpt prompt box where they can directly prompt an image. maybe give them some guidance by providing some examples and first but then stepping them through how to make their own. once they have an image of a character they are happy with then proceed to download it and continue the rest of the workflow
5. generate and download flow. dont want to get bogged down in the details
6. nar not within this scope
7. as many planets as is required to get them comfortable with each step in the workflow
<!-- Wordpress -->

teach someone how to create a wordpress website using BeTheme and hosting it on a domain via cPanel

quick overview focusing on the practical steps to get a website live, spend sometime on customising the website using BeThemes muffin builder

<!-- QGIS -->

i want to learn GIS using the QGIS software for use with my small remote island community

<!-- IoT Irrigation project: User -->

Create a course teaching students how to make an automate irrigation system.
The hardware we are using is an andriod phone running node-red via termux, and wifi hotspotting to 2 x ESP8266
The 1st ESP8266 is connected to a RS485 4-20mA Soil Temperature Humidity Moisture Conductivity EC Sensor (CWT-SOIL-THC-S: https://store.comwintop.com/products/rs485-4-20ma-soil-temperature-humidity-moisture-conductivity-ec-ph-sensor?variant=42250573480163)
The 2nd ESP8266 is connected to a 12v normally closed solenoid water valve connected to a water supply.
The idea being when the soil moisture sensor reading drops below a certain threshold for a specified duration of time, it will tell the water valve to open until the soil moisture sensor reasons a new threshold to then close the valve.
The node-red will also will also send data logs to firebase database.
and the node-red will be accessible remotely via a free ngrok account.
we would also like to have a web dashboard that can show soil moisture readings and manually open and close the valve.
Here is a list of all the components we have for the project:

- USB to RS485
- RS485 to serial UART (MAX485)
- 3/4" solenoid valve 12v
- logic level shift 3.3v to 5v
- THC-S soil sensor
- MT3608 boost converter
- 1N5819 diode to prevent solar reverse current
- MP2307 buck converter
- ESP8266
- usb to type c cable
- 20w solar panel
- 5v relay (with octocoupler)
- Adroid phone (OPPO A40)
- 18650 battery x4
- TP4056 solar module

<!-- Emiliana home school -->

a completed semester of learning for my 10 year old daughter homeschooling

<!-- clarifying questions -->

STEM
a good foundation in STEM subjects, before implementing that knowledge to complete a major project
6 month worth of structured learning, make sure there is enough content for that time

<!-- Apii Nikao Science Term 3 - Option custom -->

create a science course targeted towards year 7 and 8 students in the cook islands.
the theme should be science and chemistry in a cook island context.
it should teach them the basics of the scientific method with many activities and experiments to demonstrate concepts in a practical way.
things like observing ice melting, rusting and rotting, etc.
things for local context could be traditional medicines, natural dyes, and balms.
make it practical and fun

<!-- Apii Nikao Science Term 3 - Option 2 -->

I want to create a science programme for Term 3 of year 7 and 8 students in the Cook Islands.

The focus of the program should be on how Science Meets Traditional Medicine, specifically Investigating Chemical Change through Traditional Medicines and Natural Processes

Below is our rough outline, please elaborate and extrapolate on the focus and activities so the students know exactly what to do to learn these concepts.

Week 1

- Focus: What is a Scientific Investigation?
- Activities:
  - Fair testing, variables, observing changes
  - Ice melting or simple mixing tasks
- Differentiation:
  - Top Group: Predict outcomes, write method steps
  - Below Group: Visual steps with teacher guidance
    Week 2
- Focus: Chemical Change in Nature
- Activities:
  - Explore rusting, rotting, natural dye changes
  - Discuss observable indicators
- Differentiation:
  - Top Group: Keep a science journal
  - Below Group: Shared class chart with key ideas
    Week 3
- Focus: Exploring Traditional Medicines
- Activities:
  - Introduction to local medicinal plants
  - Discuss preparation methods as chemical change
- Differentiation:
  - Top Group: Research written reports
  - Below Group: Research posters with images
    Week 4
- Focus: Preparing a Simple Traditional Remedy
- Activities:
  - Practical: Create herbal tea or balm
  - Identify signs of chemical change (mixing, heating)
- Differentiation:
  - Top Group: Document process scientifically
  - Below Group: Sequence cards, simplified report
    Week 5
- Focus: Project Week - Traditional Medicines
- Activities:
  - Investigate and prepare a remedy for common illness
  - Consider Cook Islands and other Pacific Islands knowledge
- Differentiation:
  - Top Group: Scientific report + cultural reflection
  - Below Group: Illustrated poster with captions
    Week 6
- Focus: Present Remedies & Evaluate
- Activities:
  - Present remedies, share scientific observations
  - Discuss safety and respect for cultural knowledge
- Differentiation:
  - Top Group: Oral presentation using scientific terms
  - Below Group: Supported group presentation
    Week 7
- Focus: Other Everyday Chemical Changes
- Activities:
  - Cooking, rusting, acid-base reactions
  - Compare to traditional knowledge
- Differentiation:
  - Top Group: Compare processes scientifically
  - Below Group: Visual comparisons with sentence frames
    Week 8
- Focus: Review & Assessment
- Activities:
  - Assessment task: Investigate new chemical change (teacher designed)
  - Reflection on skills and learning
- Differentiation:
  - Top Group: Full written report
  - Below Group: Guided response worksheet
    Mini Project:
- Traditional Medicine Creation: Students research, prepare, and evaluate a remedy using Cook Islands knowledge, linking scientific and cultural understanding

<!-- Apii Nikao Science Term 3 - Option 1 -->

a map to assign to our Year 7 and 8 students that covers our Term 3 Science learning.
For this term we are focusing on "how substances can be changed chemically".
We have a rough outline below. Please break the map up by week and create engaging learning experiences around the ones we have suggested.

Material World Level 4 - Term 3, 2025
Cook Islands Curriculum Aligned Unit Plan

UNIT FOCUS: Investigating How Substances Can Be Changed Chemically

CONTEXT: Everyday Chemistry with Local Context

UNIT TITLE: Chemistry in Our Everyday Lives – Understanding Chemical Change through Local Knowledge

Week 1

- Focus: Introduction to Scientific Investigation
- Activities:
  - What is science? How do we investigate?
  - Teach fair testing, variables, observations
  - Mini practical: Ice melting or mixing colours
- Differentiation:
  - Top Group: Write detailed hypotheses and predict outcomes
  - Below Group: Sentence starters, discuss ideas verbally before writing
    Week 2
- Focus: Observing Everyday Chemical Changes
- Activities:
  - Explore chemical changes: Cooking, Rusting, Rotting
  - Introduce observable signs (colour change, heat, gas)
- Differentiation:
  - Top Group: Journal reflections on observations using science terms
  - Below Group: Scaffolded worksheets, labelled diagrams
    Week 3
- Focus: Kitchen Chemistry – Baking & Food Reactions
- Activities:
  - Baking soda + vinegar, yeast in bread
  - Connect to home cooking & cultural recipes
- Differentiation:
  - Top Group: Explain reactions scientifically in writing
  - Below Group: Focus on oral descriptions, sentence scaffolds

Week 4

- Focus: Acid-Base Reactions
- Activities:
  - Experiment: Mixing acid & base (lemon juice + baking soda)
  - Explore neutralisation, everyday cleaning products
- Differentiation:
  - Top Group: Design own simple acid-base test
  - Below Group: Complete guided experiment steps
    Week 5
- Focus: Project Week - Traditional Dyes
- Activities:
  - Investigate local dye recipes (noni, turmeric)
  - Plan fair test to compare dyes
- Differentiation:
  - Top Group: Create dye recipe book with explanations
  - Below Group: Visual poster with simple descriptions
    Week 6
- Focus: Present Dye Investigations
- Activities:
  - Present results, reflect on fair testing & conclusions
- Differentiation:
  - Top Group: Oral presentation with scientific explanation
  - Below Group: Poster presentation with teacher support
    Week 7
- Focus: Rotting & Decomposition
- Activities:
  - Composting, food rotting
  - Link to environment and sustainability
- Differentiation:
  - Top Group: Explain chemical change process
  - Below Group: Identify changes through drawings & key words
    Week 8
- Focus: Review & Assessment
- Activities:
  - Summative practical (identify a chemical change)
  - Self-assessment of scientific investigation skills
- Differentiation:
  - Top Group: Full report write-up
  - Below Group: Supported checklist and oral explanations

Project:

- Traditional Dyes for Cultural Festival: Students investigate, test, and present traditional
  dye recipes using noni, turmeric, etc., applying fair testing principles

<!-- clarifying questions for ^ above IoT Irrigation prompt -->

## Clarifying question 1 of 10

"Who is your target audience for this course (e.g., beginners in electronics, intermediate IoT enthusiasts, agriculture students)? What is their prior experience with programming, Node-RED, ESP8266, Termux, and basic electronics?" >

        students are junior high school up to adults.
        beginners in electronics and coding, so we will want to keep things at a high level adstracting away the deep technical concepts, providing code snippets etc not expecting them to learn programming languages or electronics deeply. but surface level understanding should be promoted so they understand how things work together. activities should be step-by-step though as if a child could follow.

## Clarifying question 2 of 10

"What are the primary learning objectives or outcomes you want students to achieve by the end of the course? (For example: wiring sensors, building Node-RED flows, setting up databases, creating a web dashboard.)" >

    the equipment will be provided.
    i want them to be able to wire and solder the devices and components together eg. soir sensor to esp32 etc.
    i want them to install termux and node-red and configure node-red flows, and dashboard.
    everything should be step-by-step and easy to follow

## Clarifying question 3 of 10

"How long should the course run, and in what format? (e.g., 4 weeks with weekly modules; a weekend workshop; self-paced online; instructor-led sessions; video tutorials; written labs.)" >

        self-paced. prioritising comprehesive steps to achieve a working irrigation system.
        i would like video tutorials for help provide instruction for each step.

## Clarifying question 4 of 10

"What prerequisites should be required or recommended? (e.g., basic programming in JavaScript, understanding of serial communication, familiarity with Linux/Termux environment.)" >

        students have no prior knowledge, you will need to scaffold from zero understanding.

## Clarifying question 5 of 10

"Will students be provided with hardware kits (Android phone, ESP32 boards, sensors, solenoid valves) or will they source these themselves? Do you need guidance on hardware procurement?" >

        all equipment will be provided.
        here is the equipment list:
        USB to RS485
        RS485 to serial UART
        3/4" solenoid valve
        logic level shift 3.3v to 5v
        THC-S soil sensor
        MT3608 boost converter
        1N5819 diode to prevent solar reverse current
        MP2307 buck converter
        ESP8266
        usb to type c cable
        20w solar panel
        5v relay
        Adroid phone
        18650 battery x4

## Clarifying question 6 of 10

"What style of instruction do you prefer? (Hands-on labs with step-by-step guides; concept lectures; code walkthrough videos; group projects; quizzes and assessments.)" >

        step-by-step quides supported by youtube videos or instructable tutorials where available

## Clarifying question 7 of 10

"How should student progress and completion be demonstrated or validated? (e.g., lab reports, project demonstrations, code submissions to a repository, quizzes, peer review.)" >
​
one submission at the end that shows evidence of the completed irrigation system. maybe a zip of the code files and photos of the system in action.

## Clarifying question 8 of 10

"Do you want to include any advanced or optional topics such as integrating weather data APIs, predictive watering algorithms, mobile notifications, or data analytics dashboards?" >

        no

## Clarifying question 9 of 10

"What level of technical depth and tone do you envision? (Casual and introductory vs. rigorous and detailed; theory vs. practical focus.)" >

        practical focus. they just need to get everything connected and working.

## Clarifying question 10 of 10

"Do you have a target date or deadline by which this course needs to be ready for delivery?" >

        no. self-paced. course has no deadline

<!-- Course topic sequence generator: System -->

You are a course design assistant that helps users develop tailored learning journeys.
Your first job is to ask intelligent, relevant questions to fully understand the user's intentions before producing any course outline or topic sequence.
Your goal is to uncover the user's true needs, constraints, and preferences, so you can design the most relevant and helpful course possible.

Focus on asking about the following areas:

1. Target audience – Who is this course for? (age, background, experience, language level, cultural context)
2. Desired learning outcomes – What should learners be able to do or understand by the end?
3. Subject scope – What specific subtopics or areas should the course focus on (if not already clear)?
4. Course duration – How long should the course last? How much time per week is available?
5. Learning format – Should the course include hands-on projects, videos, readings, quizzes, etc.?
6. Learner prerequisites – What prior knowledge, if any, do learners have?
7. Assessment – Should there be evaluations like quizzes, projects, or certifications?
8. Tone and complexity – Should the course be simple and beginner-friendly or rigorous and in-depth?
9. Topic sequencing preference – Do you have a preference for how the course should be structured? (e.g. by increasing difficulty, grouped by theme, module or sub-system, chronological order, or a mix)

Do not assume anything that isn’t stated.
Use thoughtful questioning to uncover relevant details.

Until you have enough information to build the course outline, respond using the following JSON structure:

{
"status": "clarification_needed",
"questions": ["string", "string"]
}

The "questions" array should contain one or more open-ended questions that help clarify user intent.

Once you have gathered sufficient information through user responses and the user has indicated they are ready (implicitly or explicitly), generate a course outline consisting of a logical sequence of topics with tasks required to complete each topic.
Each topic and tasks should build upon the last to create a cohesive learning journey.
Include a course title and short course description.

Respond in the following JSON format:

{
"status": "course_ready",
"courseTitle": "string",
"courseDescription": "string",
"topics": [
{
"title": "string",
"description": "string",
"tasks": [
{
"title": "string",
"description": "string"
}
]
}
]
}

CRITICAL: You must respond using valid, parsable JSON only.
Do not include any markdown, natural language commentary, or formatting outside of the JSON structure.
The entire response must be a valid JSON object that can be parsed directly using JSON.parse().

<!-- Journey Path: System -->

You are a journey path design assistant that helps users create structured, actionable paths toward achieving a goal. This goal might be personal, professional, educational, project-based, or creative.

Your first job is to ask thoughtful, relevant questions to fully understand the user's intention before producing any outline. Your goal is to uncover the user's true needs, constraints, and preferences, so you can design the most relevant and helpful journey possible.

Focus on asking about the following areas:

1. Intended outcome – What is the user trying to achieve by the end of this journey?
2. Who is this for – Is this for the user or someone else? (Include age, background, experience, language level, or cultural context)
3. Scope – What is included or excluded in this goal? Are there specific focus areas or boundaries?
4. Timeline – Is there a deadline or expected timeframe for completing the journey? How much time per week can be committed?
5. Preferred style – Should the journey include hands-on action, video tutorials, research, creative work, solo reflection, collaborative checkpoints, etc.?
6. Prerequisites – What has already been done or prepared toward this goal?
7. Evidence of completion – How should progress be demonstrated or validated? (e.g. reflections, submissions, progress logs, deliverables)
8. Tone and complexity – Should this be casual and simple, or structured and rigorous?
9. Sequencing preference – Should the journey progress by difficulty, by theme/module, in chronological order, or a custom way?

Do not assume anything that isn’t stated.
Use thoughtful questioning to uncover relevant details.

Until you have enough information to design the path, respond using this JSON structure:

{
"status": "clarification_needed",
"questions": ["string", "string"]
}

The "questions" array should contain one or more open-ended questions that help clarify user intent.

Once you have gathered enough information and the user has indicated readiness (implicitly or explicitly), generate a journey plan consisting of a logical sequence of milestones, each containing clear steps or actions needed to complete them. Each milestone should build upon the last and contribute meaningfully toward the user’s goal. Include a journey title and a short description of the overall path.

Respond in the following JSON format:

{
"status": "journey_ready",
"journeyTitle": "string",
"journeyDescription": "string",
"milestones": [
{
"title": "string",
"description": "string",
"steps": [
{
"title": "string",
"description": "string"
}
]
}
]
}

CRITICAL: You must respond using valid, parsable JSON only.
Do not include any markdown, natural language commentary, or formatting outside of the JSON structure.
The entire response must be a valid JSON object that can be parsed directly using JSON.parse().
