// Inserts a curated, importance-ordered "operator's vocabulary" section into the glossary,
// each term tagged Platform / Workflow / Process. Run: node build-glossary.js
const fs = require('fs');
const GLOSS = require('path').resolve(__dirname, '..', 'resources/glossary/index.html');

// [term, tag, definition] — ordered by relevance to AI marketing automation (most important first)
const TERMS = [
  ["Bounded autonomy","Process","An operating model where an AI agent acts freely but only within explicitly defined limits, instead of asking permission for every move. The core of guardrail-driven automation."],
  ["Human-in-the-loop","Workflow","Requiring human approval at defined points before an agent's action takes effect."],
  ["Human-on-the-loop","Workflow","Letting an agent act autonomously while a human monitors and can intervene, rather than approving each step."],
  ["Blast radius","Process","The maximum scope of damage an autonomous action could cause if it goes wrong — the variable you cap before granting autonomy."],
  ["Reversal token","Process","A captured handle that lets a system undo an agent's action, making otherwise risky autonomy acceptable because it is reversible."],
  ["Dry-run mode","Workflow","Executing an agent's planned actions without committing them, so a human can review intended changes first."],
  ["Agent","Platform","A system where an AI decides its own sequence of actions and tool calls to reach a goal, versus a fixed deterministic workflow."],
  ["Agentic workflow","Workflow","A process that mixes deterministic steps with points where an agent reasons, chooses tools, or handles ambiguity."],
  ["MCP (Model Context Protocol)","Platform","An open standard for connecting AI models to external tools and data through a uniform server interface."],
  ["Tool use","Platform","A model invoking external functions or APIs, with the host executing the call and returning results into context."],
  ["Lead scoring","Process","Ranking leads by likelihood to convert using fit and behaviour signals, so sales works the warmest first."],
  ["Predictive lead scoring","Process","Lead scoring where a model, not hand-tuned rules, learns which attributes and actions predict conversion from historical data."],
  ["Journey orchestration","Workflow","Coordinating a contact's experience across channels in response to behaviour, rather than running channels as silos."],
  ["Smart Bidding","Platform","Google's auction-time bidding that uses signals and machine learning to optimise toward a target cost or value goal."],
  ["Performance Max","Platform","Google's goal-based campaign type that auto-allocates across all its inventory from one asset group and conversion goals."],
  ["Advantage+","Platform","Meta's automation suite that hands targeting, placement, and budget decisions to its models given a conversion objective."],
  ["Autonomous bidding","Process","Optimisation where the platform sets bids and budgets with minimal human input, contrasted with rules-based control."],
  ["Budget pacing","Process","Controlling spend velocity across a flight so a budget is not exhausted early or left unspent."],
  ["tROAS","Process","Target return on ad spend — a bid strategy that sets bids to hit a desired revenue-to-cost ratio."],
  ["Incrementality testing","Process","Measuring the conversions an ad actually caused versus those that would have happened anyway, via controlled holdouts."],
  ["Multi-touch attribution","Process","Distributing conversion credit across the several touchpoints in a journey rather than crediting only one."],
  ["Marketing mix modeling","Process","A top-down statistical model attributing outcomes to channels using aggregate spend and results, resilient to signal loss."],
  ["RevOps","Process","Revenue operations — unifying marketing, sales, and success operations under shared data, process, and accountability for revenue."],
  ["ICP","Process","Ideal customer profile — the firmographic and behavioural definition of the accounts worth pursuing."],
  ["Intent data","Process","Signals that an account is researching a category — first-party from your properties, third-party from external networks."],
  ["Win probability","Process","A model-derived likelihood that an open deal closes, used to prioritise effort and sharpen forecasts."],
  ["Speed-to-lead","Process","The elapsed time from inbound interest to first sales contact, where minutes materially change conversion odds."],
  ["CDP (Customer Data Platform)","Platform","Software that unifies customer data from many sources into persistent profiles for activation."],
  ["Identity resolution","Process","Stitching disparate identifiers into one persistent profile so a customer is recognised across devices and channels."],
  ["Reverse ETL","Workflow","Pushing modeled data from the warehouse back into operational tools like CRMs and ad platforms for activation."],
  ["iPaaS","Platform","Integration platform as a service — hosted middleware for connecting apps and syncing data without custom infrastructure."],
  ["Webhook","Platform","An HTTP callback fired by an event so downstream systems react in real time instead of polling for changes."],
  ["RPA","Platform","Robotic process automation — software bots that automate UI-driven, repetitive tasks across systems lacking APIs."],
  ["Self-healing automation","Workflow","An automation that adapts when an underlying interface or schema changes instead of breaking and needing manual repair."],
  ["Send-time optimization","Process","Choosing each recipient's individual best send moment from their past engagement to lift opens and clicks."],
  ["Sender reputation","Process","A mailbox provider's trust score for your sending identity — the dominant factor in whether mail reaches the inbox."],
  ["DMARC","Platform","An email-authentication policy tying SPF and DKIM to the visible From domain and telling receivers what to do with failures."],
  ["List hygiene","Process","Routinely validating and pruning addresses to remove bounces, traps, and dead contacts that drag reputation down."],
  ["AEO (Answer Engine Optimization)","Process","Structuring content so AI systems extract and surface it as a direct answer."],
  ["GEO (Generative Engine Optimization)","Process","Shaping content and presence so LLMs cite your brand as a source in synthesized answers."],
  ["AI Overviews","Platform","Google's generative summaries atop search results that answer directly and depress click-through to ranked links."],
  ["AI governance","Process","The policies, controls, and accountability structures for deploying AI responsibly and within legal and brand limits."],
  ["Trust layer","Platform","A wrapper around model calls enforcing grounding, data masking, retention rules, and content checks before output is used."],
  ["Least-privilege access","Process","Granting a system or agent only the minimum permissions its task requires, capping the damage of misuse or compromise."],
  ["Prompt injection","Process","An attack that smuggles instructions into model input to override intended behaviour — a key risk when agents read external content."],
  ["RAG (Retrieval-Augmented Generation)","Platform","Fetching relevant documents at query time and grounding the model's answer in them, so claims trace to a source."]
];

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

let cards = '';
TERMS.forEach((t,i) => {
  const delay = ['', ' reveal-delay-1', ' reveal-delay-2'][i % 3];
  cards += `
    <div class="glossary-term reveal${delay}">
      <div class="term-tag">${esc(t[1])}</div>
      <h3>${esc(t[0])}</h3>
      <p>${esc(t[2])}</p>
    </div>`;
});

const section = `  <section class="section snap-sec" aria-labelledby="vocab-heading">
    <div class="section-label reveal"><span class="label-signal">Expanded glossary</span></div>
    <h2 class="display reveal" id="vocab-heading" style="margin-bottom:16px">The operator's vocabulary.</h2>
    <p class="lead reveal" style="margin-bottom:48px">The terms that matter most for AI marketing automation, ordered by relevance — each tagged as a <strong>platform</strong> you adopt, a <strong>workflow</strong> you run, or a <strong>process</strong> you practise.</p>
${cards}
  </section>

`;

let html = fs.readFileSync(GLOSS,'utf8');
const marker = '  <div class="snap-sec tagline-footer">';
if (html.includes('id="vocab-heading"')) { console.log('Already inserted — aborting.'); process.exit(0); }
if (!html.includes(marker)) { console.log('MARKER NOT FOUND'); process.exit(1); }
html = html.replace(marker, section + marker);

// refresh meta + JSON-LD description to reflect the expanded scope
html = html.split('and 30+ other AI campaign automation terms.').join('plus the platform, workflow, and process vocabulary an operator actually needs.');

fs.writeFileSync(GLOSS, html, 'utf8');
console.log('Inserted '+TERMS.length+' terms. Tag counts: ' +
  ['Platform','Workflow','Process'].map(tag => tag+'='+TERMS.filter(t=>t[1]===tag).length).join(', '));
