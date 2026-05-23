import type { Activity, CategoryId, User } from '../types'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const CHARACTERS: Array<{ name: string; title: string; code: string }> = [
  { name: 'Ahsoka Tano', title: 'Jedi Padawan', code: 'CSN.JCN.NC' },
  { name: 'Anakin Skywalker', title: 'Jedi Knight', code: 'CSN.JCN.NC' },
  { name: 'Obi-Wan Kenobi', title: 'Jedi Master', code: 'CSN.JCN.HC' },
  { name: 'Mace Windu', title: 'Jedi Master', code: 'CSN.JCN.HC' },
  { name: 'Yoda', title: 'Grand Master', code: 'CSN.JCN.GM' },
  { name: 'Luke Skywalker', title: 'Jedi Knight', code: 'TAT.MOS.FRM' },
  { name: 'Leia Organa', title: 'Senator', code: 'ALD.RYL.SEN' },
  { name: 'Han Solo', title: 'Captain', code: 'MIL.SMF.SMG' },
  { name: 'Padmé Amidala', title: 'Senator', code: 'NAB.RYL.SEN' },
  { name: 'Rey Skywalker', title: 'Jedi Initiate', code: 'JAK.TAK.SCR' },
  { name: 'Finn FN-2187', title: 'Resistance Officer', code: 'DQR.RES.SLD' },
  { name: 'Poe Dameron', title: 'Captain', code: 'DQR.RES.PIL' },
  { name: 'Cassian Andor', title: 'Intelligence Officer', code: 'SCA.RBL.INT' },
  { name: 'Jyn Erso', title: 'Sergeant', code: 'JED.RBL.INF' },
  { name: 'Bail Organa', title: 'Senator', code: 'ALD.RYL.SEN' },
  { name: 'Mon Mothma', title: 'Senator', code: 'CHN.RYL.SEN' },
  { name: 'Kit Fisto', title: 'Jedi Master', code: 'CSN.JCN.HC' },
  { name: 'Plo Koon', title: 'Jedi Master', code: 'CSN.JCN.HC' },
  { name: 'Shaak Ti', title: 'Jedi Master', code: 'KMN.GAR.MNT' },
  { name: 'Luminara Unduli', title: 'Jedi Master', code: 'CSN.JCN.GEN' },
  { name: 'Aayla Secura', title: 'Jedi Knight', code: 'CSN.JCN.NC' },
  { name: 'Quinlan Vos', title: 'Jedi Master', code: 'CSN.JCN.NC' },
  { name: 'Ki-Adi-Mundi', title: 'Jedi Master', code: 'CSN.JCN.HC' },
  { name: 'Saesee Tiin', title: 'Jedi Master', code: 'CSN.JCN.HC' },
  { name: 'Adi Gallia', title: 'Jedi Master', code: 'CSN.JCN.HC' },
  { name: 'Even Piell', title: 'Jedi Master', code: 'CSN.JCN.HC' },
  { name: 'Depa Billaba', title: 'Jedi Master', code: 'CSN.JCN.HC' },
  { name: 'Eeth Koth', title: 'Jedi Master', code: 'CSN.JCN.HC' },
  { name: 'Barriss Offee', title: 'Jedi Knight', code: 'CSN.JCN.MED' },
  { name: 'Cin Drallig', title: 'Battlemaster', code: 'CSN.JCN.TMP' },
  { name: 'Tera Sinube', title: 'Jedi Master', code: 'CSN.JCN.ARC' },
  { name: 'Jocasta Nu', title: 'Chief Librarian', code: 'CSN.JCN.ARC' },
  { name: 'CT-7567 Rex', title: 'Captain', code: 'KMN.GAR.501' },
  { name: 'CT-5555 Fives', title: 'ARC Trooper', code: 'KMN.GAR.501' },
  { name: 'CT-21-0408 Echo', title: 'ARC Trooper', code: 'KMN.GAR.501' },
  { name: 'CC-2224 Cody', title: 'Marshal Commander', code: 'KMN.GAR.212' },
  { name: 'CC-3636 Wolffe', title: 'Commander', code: 'KMN.GAR.WLF' },
  { name: 'CC-1010 Fox', title: 'Commander', code: 'KMN.GAR.GRD' },
  { name: 'CT-9904 Crosshair', title: 'Sniper', code: 'KMN.GAR.BAD' },
  { name: 'CT-9901 Tech', title: 'Specialist', code: 'KMN.GAR.BAD' },
  { name: 'CT-9902 Wrecker', title: 'Heavy', code: 'KMN.GAR.BAD' },
  { name: 'CT-99 Hunter', title: 'Sergeant', code: 'KMN.GAR.BAD' },
  { name: 'Bo-Katan Kryze', title: 'Mandalore', code: 'MND.NTC.NWA' },
  { name: 'Pre Vizsla', title: 'Mandalore', code: 'MND.DTH.WTC' },
  { name: 'Din Djarin', title: 'Mandalorian', code: 'MND.NVA.HUN' },
  { name: 'Sabine Wren', title: 'Specialist', code: 'KRN.MND.RBL' },
  { name: 'Hera Syndulla', title: 'General', code: 'RYL.MFL.PHX' },
  { name: 'Cham Syndulla', title: 'Resistance Leader', code: 'RYL.RBL.LDR' },
  { name: 'Kanan Jarrus', title: 'Jedi Knight', code: 'LTH.GHO.SPC' },
  { name: 'Ezra Bridger', title: 'Padawan', code: 'LTH.GHO.SPC' },
  { name: 'Riyo Chuchi', title: 'Senator', code: 'PNT.RYL.SEN' },
  { name: 'Halle Burtoni', title: 'Senator', code: 'KMN.RYL.SEN' },
  { name: 'Lott Dod', title: 'Senator', code: 'NMD.TFD.SEN' },
  { name: 'Orn Free Taa', title: 'Senator', code: 'RYL.RYL.SEN' },
  { name: 'Mas Amedda', title: 'Vice Chair', code: 'CSN.RYL.OFC' },
  { name: 'Wilhuff Tarkin', title: 'Admiral', code: 'CSN.NAV.OFC' },
  { name: 'Gial Ackbar', title: 'Admiral', code: 'MON.MNC.OFC' },
  { name: 'Wedge Antilles', title: 'Lieutenant', code: 'RYL.RGD.LED' },
  { name: 'Biggs Darklighter', title: 'Lieutenant', code: 'RYL.RGD.LED' },
  { name: 'Lando Calrissian', title: 'Baron Administrator', code: 'CLD.CIT.GVN' },
  { name: 'Saw Gerrera', title: 'Partisan Leader', code: 'JED.PRT.GRR' },
  { name: 'Rose Tico', title: 'Mechanic', code: 'CRI.RES.MCH' },
  { name: 'Count Dooku', title: 'Sith Lord', code: 'SRN.SEP.LDR' },
  { name: 'Darth Maul', title: 'Sith Lord', code: 'DTM.SHA.RBL' },
  { name: 'Asajj Ventress', title: 'Sith Apprentice', code: 'DTM.SHA.SOL' },
  { name: 'Cad Bane', title: 'Bounty Hunter', code: 'DTM.BTC.SOL' },
  { name: 'Boba Fett', title: 'Bounty Hunter', code: 'TAT.BTC.PAL' },
  { name: 'Embo', title: 'Bounty Hunter', code: 'PHL.BTC.SOL' },
  { name: 'Katooni', title: 'Bear Clan Initiate', code: 'CSN.JCN.YGL' },
  { name: 'Byph', title: 'Bear Clan Initiate', code: 'CSN.JCN.YGL' },
  { name: 'Gungi', title: 'Bear Clan Initiate', code: 'CSN.JCN.YGL' },
  { name: 'Petro', title: 'Bear Clan Initiate', code: 'CSN.JCN.YGL' },
  { name: 'Ganodi', title: 'Bear Clan Initiate', code: 'CSN.JCN.YGL' },
  { name: 'Zatt', title: 'Bear Clan Initiate', code: 'CSN.JCN.YGL' },
]

const AVATAR_COLORS = [
  '#dbeafe',
  '#ede9fe',
  '#d1fae5',
  '#fee2e2',
  '#fce7f3',
  '#e0f2fe',
  '#fef3c7',
  '#ecfdf5',
  '#f3e8ff',
  '#fff7ed',
]

const ACTIVITY_TEMPLATES: Record<CategoryId, string[]> = {
  education: [
    'Internal workshop on lightsaber form fundamentals',
    'Holocron archive maintenance session',
    'Force meditation training for initiates',
    'Clone trooper tactical briefing module',
    'Republic code of conduct lunch-and-learn',
    'Starship navigation fundamentals course',
    'Droid maintenance certification workshop',
    'Galactic history seminar for cadets',
    'Battlefield medicine training module',
    'Republic logistics planning workshop',
  ],
  'public-speaking': [
    'Keynote at Galactic Senate education summit',
    'Panel: Jedi training in wartime',
    'Talk at Coruscant developer meetup',
    'Presentation at Outer Rim tech conference',
    'Podcast: leadership under the Republic',
    'Lightning talk at Kamino engineering day',
    'Webinar: fleet coordination best practices',
    'Guest speaker at academy graduation',
    'Fireside chat at Mandalore peace forum',
    'Briefing to Senate oversight committee',
  ],
  'university-partnerships': [
    'Co-supervised thesis on hyperspace routing',
    'Guest lecture at Jedi academy campus',
    'Intern pipeline with Alderaan university',
    'Research collaboration on kyber crystals',
    'Judged Republic youth science fair',
    'On-campus recruitment information session',
    'Co-authored whitepaper with academy partner',
    'Summer intern cohort supervision',
    'Curriculum advisory board meeting',
    'Sponsored final-year engineering competition',
  ],
}

const POINT_VALUES = [4, 8, 16, 32, 64]

function randomDate(rng: () => number): string {
  const year = [2023, 2024, 2025][Math.floor(rng() * 3)]
  const month = Math.floor(rng() * 12) + 1
  const day = Math.floor(rng() * 28) + 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function generateUsers(): User[] {
  return CHARACTERS.map((character, index) => {
    const rng = seeded(index * 7919 + 31)
    const activityCount = Math.floor(rng() * 12) + 5
    const activities: Activity[] = []

    for (let j = 0; j < activityCount; j++) {
      const categories: CategoryId[] = ['education', 'public-speaking', 'university-partnerships']
      const category = categories[Math.floor(rng() * categories.length)]
      const templates = ACTIVITY_TEMPLATES[category]
      const name = templates[Math.floor(rng() * templates.length)]
      const points = POINT_VALUES[Math.floor(rng() * POINT_VALUES.length)]

      activities.push({
        id: `${index}-${j}`,
        name,
        category,
        date: randomDate(rng),
        points,
      })
    }

    return {
      id: String(index + 1),
      name: character.name,
      role: `${character.title} (${character.code})`,
      avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      activities,
    }
  })
}

export const USERS: User[] = generateUsers()
