import test from 'node:test'
import assert from 'node:assert/strict'
import { crewTalk, crewIndex } from './crewTalk.js'

const base = (over = {}) => ({
  day: 4, sheltering: false, active_conditions: {}, efficiency: { solar: 1 },
  values: { power: 70, oxygen: 70, water: 60, food: 60, crew_health: 95, comms: 90, ...over.values },
  ...Object.fromEntries(Object.entries(over).filter(([k]) => k !== 'values')),
})

test('calm outpost gets one cheerful line, same every time for the same day', () => {
  const a = crewTalk(base()), b = crewTalk(base())
  assert.equal(a.length, 1); assert.equal(a[0].level, 'ok'); assert.deepEqual(a, b)
})

test('calm lines rotate with the day', () => {
  const speakers = [0, 1, 2, 3].map((d) => crewTalk(base({ day: d }))[0].who)
  assert.equal(new Set(speakers).size, 4)
})

test('the right astronaut speaks about the right problem', () => {
  assert.equal(crewTalk(base({ values: { power: 10 } }))[0].who, 'Kai')
  assert.equal(crewTalk(base({ values: { water: 10 } }))[0].who, 'Mira')
  assert.equal(crewTalk(base({ values: { comms: 20 } }))[0].who, 'Leo')
  assert.equal(crewTalk(base({ active_conditions: { radiation_hazard: true } }))[0].who, 'Ava')
})

test('urgent problems come before warnings and at most two lines are shown', () => {
  const out = crewTalk(base({ values: { power: 30, water: 10, comms: 20, food: 30 } }))
  assert.equal(out.length, 2); assert.equal(out[0].level, 'danger')
  assert.equal(out[0].who, 'Mira')
})

test('sheltering is reported calmly, not as an alarm', () => {
  const out = crewTalk(base({ sheltering: true, active_conditions: { radiation_hazard: true } }))
  assert.equal(out[0].level, 'ok'); assert.match(out[0].line, /shelter/)
})

test('dusty panels are reported as the cause, not just low sunlight', () => {
  const out = crewTalk(base({ efficiency: { solar: 0.7 }, active_conditions: { low_sunlight: true } }))
  assert.match(out[0].line, /dust/i)
})

test('crewIndex finds each astronaut', () => {
  assert.deepEqual(['Ava', 'Kai', 'Mira', 'Leo'].map(crewIndex), [0, 1, 2, 3])
})
