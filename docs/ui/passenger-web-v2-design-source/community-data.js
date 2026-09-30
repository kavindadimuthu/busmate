const C = (id, name, city, points, routes, stops, schedules, fixes, acc, streak, joined, bio, areas) => ({ id, name, handle:'@' + name.split(' ')[0].toLowerCase() + id.slice(1), city, points, routes, stops, schedules, fixes, acc, streak, joined, bio, areas,
  level: points >= 9000 ? 'Platinum' : points >= 5000 ? 'Gold' : points >= 2000 ? 'Silver' : 'Bronze',
  helped: Math.round(points * 5.2), month: Math.round(points * 0.17) });
export const PEOPLE = [
 C('c01', 'Sanduni Wijesinghe', 'Colombo', 12480, 142, 610, 388, 204, 98, 94, 'Apr 2024', 'Rides the Colombo–Kandy line daily and keeps every stop on it verified. Loves a tidy timetable.', ['Colombo', 'Kandy', 'Kegalle']),
 C('c02', 'Ruwan Jayasuriya', 'Kandy', 10920, 118, 540, 452, 160, 97, 71, 'May 2024', 'Hill-country regular. Specialises in Kandy, Nuwara Eliya and Badulla schedules.', ['Kandy', 'Nuwara Eliya', 'Badulla']),
 C('c03', 'Ishara Fernando', 'Galle', 9640, 96, 488, 310, 141, 99, 58, 'Jun 2024', 'Southern coast expert; adds photos of every stop she visits.', ['Galle', 'Matara', 'Hikkaduwa']),
 C('c04', 'Kavinda Silva', 'Negombo', 7210, 64, 402, 260, 98, 96, 39, 'Aug 2024', 'Airport-side routes and short commuter links.', ['Negombo', 'Ja-Ela', 'Katunayake']),
 C('c05', 'Tharushi Perera', 'Kurunegala', 6480, 71, 330, 244, 87, 96, 44, 'Sep 2024', 'Keeps the northern corridor timetables fresh.', ['Kurunegala', 'Anuradhapura']),
 C('c06', 'Dilshan Kumara', 'Anuradhapura', 5320, 52, 290, 201, 66, 95, 27, 'Oct 2024', 'Cultural triangle routes and night services.', ['Anuradhapura', 'Dambulla']),
 C('c07', 'Nethmi Rajapaksha', 'Matara', 4180, 38, 260, 150, 52, 97, 33, 'Nov 2024', 'Southern expressway interchanges and transfer points.', ['Matara', 'Weligama']),
 C('c08', 'Chamara Bandara', 'Ratnapura', 3390, 30, 214, 122, 45, 94, 19, 'Jan 2025', 'Gem-city routes and rural connectors.', ['Ratnapura', 'Avissawella']),
 C('c09', 'Piumi Herath', 'Jaffna', 2610, 26, 172, 96, 31, 95, 22, 'Feb 2025', 'Northern peninsula stops and long-distance services.', ['Jaffna', 'Kilinochchi']),
 C('c10', 'Mahesh Gunawardena', 'Badulla', 1720, 14, 118, 70, 19, 93, 11, 'Mar 2025', 'Newer contributor mapping the Badulla–Ella road.', ['Badulla', 'Ella'])
];
export const CATS = { All:p => p.points, Routes:p => p.routes, Stops:p => p.stops, Schedules:p => p.schedules, Corrections:p => p.fixes };
export const TIERS = [
 { n:'Bronze', min:0, perk:'Contributor badge on your profile' },
 { n:'Silver', min:2000, perk:'Early access to new features' },
 { n:'Gold', min:5000, perk:'Free booking fees each month' },
 { n:'Platinum', min:9000, perk:'Annual BusMate travel pass and recognition on the app' }
];
