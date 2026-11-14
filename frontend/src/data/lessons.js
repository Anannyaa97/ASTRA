// Astronaut Academy lessons. Written for ages 7-12.
// "real" holds general, well-known space facts. "game" explains what the same idea does in ASTRA,
// where numbers are simplified game units and never real NASA measurements.
export const LESSONS = [
  {
    id: 'power',
    title: 'Power from the Sun',
    icon: 'Sun',
    bigIdea: 'Solar panels only make electricity when sunlight hits them.',
    how: [
      'Solar panels turn sunlight into electricity. No sunlight means no new power.',
      'Batteries store extra energy so the crew still has power in the dark.',
      'When power is short, engineers switch off the least important jobs first and keep air and water running.',
    ],
    real: 'At most places on the Moon, daylight lasts about two weeks and then the night lasts about two weeks. Near the South Pole the Sun stays low in the sky, so shadows are long, and some crater floors never get sunlight at all.',
    game: 'Power is shared between oxygen, water, the greenhouse, the link to Earth and science. If power runs short, science and the greenhouse switch off first.',
    tryIt: { text: 'Try the What If? Lab: lower the Sunlight power slider and watch Power.', to: '/what-if' },
  },
  {
    id: 'air',
    title: 'Air to breathe',
    icon: 'Wind',
    bigIdea: 'On the Moon there is no air, so the crew has to make their own.',
    how: [
      'People breathe in oxygen and breathe out carbon dioxide.',
      'A machine called an oxygen generator makes fresh oxygen. It needs electricity to work.',
      'That is why life support always gets power before anything else.',
    ],
    real: 'On the International Space Station, oxygen is made by using electricity to split water into oxygen and hydrogen.',
    game: 'Oxygen goes down every day because the crew breathes it, and the oxygen generator tops it up. Keep it powered.',
    tryIt: { text: 'Ask your Mission Advisor what it thinks about the air.', to: '/advisor' },
  },
  {
    id: 'water',
    title: 'Water that never goes to waste',
    icon: 'Droplets',
    bigIdea: 'Water is too heavy and expensive to carry from Earth, so astronauts clean and reuse it.',
    how: [
      'A water recycler cleans used water so it can be drunk again.',
      'Plants drink water too, so a bigger greenhouse needs more.',
      'The recycler is a machine. It needs power and it can break.',
    ],
    real: 'The International Space Station recycles most of its water, including moisture from the air that comes from the crew breathing and sweating.',
    game: 'Each greenhouse level uses more water. If the recycler cannot keep up, water slowly drops.',
    tryIt: { text: 'Try the What If? Lab: raise Water recycling and see what changes.', to: '/what-if' },
  },
  {
    id: 'food',
    title: 'Growing food in space',
    icon: 'Sprout',
    bigIdea: 'Plants can feed the crew, but they need light, water and time.',
    how: [
      'A greenhouse uses electric lights, water and care to grow plants.',
      'Plants grow slowly, so a change today helps food days later.',
      'Growing more food costs more power and water, so it is always a trade-off.',
    ],
    real: 'Astronauts on the International Space Station have grown lettuce and other plants, which helps scientists learn how to feed crews on long trips.',
    game: 'Changing the greenhouse level changes power and water use right away, but food catches up over several days.',
    tryIt: { text: 'Try the What If? Lab: change Food production and look at the whole picture.', to: '/what-if' },
    more: { text: 'Read more: Food production on the Moon and in remote areas (Canadian Space Agency)', href: 'https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/' },
  },
  {
    id: 'radiation',
    title: 'Radiation and shelters',
    icon: 'ShieldCheck',
    bigIdea: 'Space has radiation. Thick walls, shelters and shielding keep people safer.',
    how: [
      'The Sun and deep space send out tiny, very fast particles called radiation.',
      'Shielding is material that blocks some of it. A shelter is a protected room where the crew waits out a storm.',
      'Protecting the crew can mean pausing other work for a while.',
    ],
    real: 'On Earth, the air and the planet’s magnetic field protect us. The Moon has almost no atmosphere and no global magnetic field, so lunar outposts need their own protection.',
    game: 'In ASTRA the radiation risk is a simulated number. It is not a real radiation dose. Sheltering protects the most, and extra shielding helps too.',
    tryIt: { text: 'Try the What If? Lab: add extra shielding and turn on the training storm.', to: '/what-if' },
  },
  {
    id: 'dust',
    title: 'Moon dust',
    icon: 'CloudFog',
    bigIdea: 'Moon dust is sharp and sticky, and it can make solar panels work worse.',
    how: [
      'Moon dust is made of tiny sharp grains. It clings to suits, tools and machines.',
      'A dusty solar panel catches less sunlight, so it makes less power.',
      'Cleaning the panels brings the power back.',
    ],
    real: 'On Earth, wind and water wear dust grains smooth. The Moon has neither, and the Apollo astronauts found that moon dust stuck to everything.',
    game: 'When dust lands on your panels, they work at a lower percentage until you clean them.',
    tryIt: { text: 'Your Systems Engineer will tell you when the panels need care.', to: '/advisor' },
  },
  {
    id: 'comms',
    title: 'The slow, sometimes broken, link to Earth',
    icon: 'Radio',
    bigIdea: 'Even at the speed of light, messages between the Moon and Earth take real time, and the link can drop.',
    how: [
      'Radio signals travel at the speed of light, but the Moon is still far enough away that a message takes over a second to arrive, and over a second more to reply.',
      'Near the Moon\'s South Pole, Earth sits very low in the sky. Hills and crater walls can block a straight line to Earth, which is why real missions there plan to use relay equipment instead of always talking to Earth directly.',
      'The link to Earth is also a piece of equipment. If it loses power or breaks down, the crew is on their own until it is fixed.',
    ],
    real: 'Every real Moon mission deals with this delay. Apollo astronauts and Mission Control had to get used to pausing and waiting for replies, and future Artemis missions near the South Pole are planning relay satellites so crews are not cut off by the terrain.',
    game: 'Your "Link to Earth" value stands for the comms equipment\'s health. When it drops below 70, replies from Mission Control slow down. Below 25, the signal is lost completely and your advisors go quiet until power or repairs bring it back.',
    tryIt: { text: 'Open your Mission Advisor during a weak or lost signal to see what Earth can and can\'t tell you.', to: '/advisor' },
  },
]

// Which lesson explains each mission event (event ids come from backend/app/data/events.py).
export const EVENT_LESSON = {
  habitat_activation: 'power',
  reduced_sunlight: 'power',
  battery_shortage: 'power',
  communication_interruption: 'comms',
  science_opportunity: 'power',
  oxygen_maintenance: 'air',
  water_recycler_malfunction: 'water',
  greenhouse_expansion: 'food',
  solar_particle_warning: 'radiation',
  radiation_shelter_inspection: 'radiation',
  dust_on_equipment: 'dust',
  oxygen_filter_clog: 'air',
  greenhouse_blight: 'food',
}

export const lessonById = (id) => LESSONS.find((l) => l.id === id)
