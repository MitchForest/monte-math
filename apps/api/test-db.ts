import Database from 'bun:sqlite'

const db = new Database('monte.db')

const skillCount = db.query('SELECT COUNT(*) as count FROM skills').get()
const prereqCount = db.query('SELECT COUNT(*) as count FROM skill_prerequisites').get()

console.log('Skills:', skillCount)
console.log('Prerequisites:', prereqCount)

// Show a few skills
const skills = db.query('SELECT * FROM skills LIMIT 5').all()
console.log('\nFirst 5 skills:', skills)

db.close()
