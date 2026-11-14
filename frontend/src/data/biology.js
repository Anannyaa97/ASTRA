// Space biology cards. Every card was checked against the page named in `checkedFrom` on 7 November 2026.
// Nothing here is invented: "observed" uses the source's own findings in simpler words.
// If a source cannot be read, the card is NOT added.
export const CHECKED_ON = '7 November 2026'

export const BIOLOGY_CARDS = [
  {
    id: 'lettuce-veg01a',
    topic: 'Plants and food',
    kind: 'NASA OSDR study (OSD-267)',
    shortTitle: 'Can astronauts grow safe lettuce?',
    title: 'Microbiological and nutritional analysis of lettuce crops grown on the International Space Station-VEG01A',
    studied: 'Scientists grew red romaine lettuce in Veggie plant growth chambers on the space station, and also on the ground. They tested the lettuce for germs, looked at the tiny life living on the leaves, and measured its nutrients.',
    observed: 'NASA’s summary says: “This study indicated that leafy vegetable crops can produce safe, edible, fresh food.”',
    matters: 'Packing months of food for a trip is hard. Growing fresh food on the way could help crews eat well on long missions.',
    link: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-267',
    linkLabel: 'See the study at NASA OSDR',
    checkedFrom: 'NASA dataset listing on catalog.data.gov (publisher: Open Science Data Repository)',
  },
  {
    id: 'roots-apex04',
    topic: 'Plants and food',
    kind: 'NASA research summary (APEX-04)',
    shortTitle: 'Roots in space',
    title: 'Roots in space: thale cress seedlings',
    studied: 'Scientists looked at the roots of small thale cress seedlings grown on the space station and checked which genes were switched on.',
    observed: 'They found “differences in the expression of specific genes in the root systems of the plants.” Two of those genes had not been linked to root growth before.',
    matters: 'Knowing how roots grow in space could help scientists design plants that grow better on long missions.',
    link: 'https://www.nasa.gov/missions/station/iss-research/space-gardens/',
    linkLabel: 'Read NASA’s Space Gardens page',
    checkedFrom: 'NASA Space Gardens page on nasa.gov',
  },
  {
    id: 'hormones-auxin',
    topic: 'Plants and food',
    kind: 'NASA research summary (Auxin Transport)',
    shortTitle: 'Which way is up?',
    title: 'Which way is up? Plant hormones in microgravity',
    studied: 'Scientists studied hormones that help a plant decide which way to grow. They looked at pea and maize seedlings grown in microgravity on the space station.',
    observed: 'Microgravity “caused decreases in hormones involved in determining direction of growth in pea seedlings,” while maize seedlings showed increases in those hormones.',
    matters: 'Different plants may react in different ways to space, so scientists need to test the plants they want to grow.',
    link: 'https://www.nasa.gov/missions/station/iss-research/space-gardens/',
    linkLabel: 'Read NASA’s Space Gardens page',
    checkedFrom: 'NASA Space Gardens page on nasa.gov',
  },
  {
    id: 'inspiration4-data',
    topic: 'Astronaut biology',
    kind: 'Science paper about NASA OSDR data',
    shortTitle: 'Sharing astronaut data with the world',
    title: 'Inspiration4 data access through the NASA Open Science Data Repository',
    studied: 'In 2021 four civilian astronauts flew on the SpaceX Inspiration4 mission. Scientists collected many kinds of body and health measurements from them, including blood tests and gene studies.',
    observed: 'This paper is a guide to the data, not a list of results. It explains that NASA’s OSDR shares data from 10 studies from the mission with scientists around the world.',
    matters: 'When many scientists can study the same space data, we learn faster how spaceflight affects the human body.',
    link: 'https://www.nature.com/articles/s41526-024-00393-5',
    linkLabel: 'Read the paper (npj Microgravity, 2024)',
    checkedFrom: 'The paper’s abstract and methods on nature.com',
  },
]
