import { requireUser } from '@/lib/auth';
import { getMySQL } from '@/lib/mysql';
import { getMongoDB } from '@/lib/mongodb';
import { skills, id } from '@/lib/validation';
import { endpoint, problem } from '@/lib/http';
export const GET = endpoint(async (request) => {
  const user = await requireUser();
  const parameters = new URL(request.url).searchParams;
  const mongo = await getMongoDB();
  let desiredSkills = skills.parse(
    (parameters.get('skills') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  if (parameters.get('team_id')) {
    const teamId = id.parse(parameters.get('team_id'));
    const [teams] = await getMySQL().execute('SELECT id FROM teams WHERE id=?', [teamId]);
    if (!teams.length) problem('Team not found.', 404);
    const opening = await mongo.collection('team_openings').findOne({ team_id: String(teamId) });
    if (!opening) problem('Add recruitment requirements first.');
    desiredSkills = opening.required_skills;
  }
  // Eligibility comes from SQL BEFORE ranking/pagination: no eligible matches get lost.
  const [eligible] = await getMySQL().execute(
    `SELECT u.id,u.name FROM users u LEFT JOIN memberships m ON m.user_id=u.id WHERE u.role='participant' AND u.id<>? AND m.user_id IS NULL`,
    [user.id]
  );
  const availableNames = new Map(eligible.map((p) => [String(p.id), p.name]));
  const results = await mongo
    .collection('participant_profiles')
    .aggregate([
      { $match: { discoverable: true, user_id: { $in: [...availableNames.keys()] } } },
      { $addFields: { matched_skills: { $setIntersection: ['$skills', desiredSkills] } } },
      { $addFields: { matched_count: { $size: '$matched_skills' } } },
      { $sort: { matched_count: -1, user_id: 1 } },
      { $limit: 100 },
      { $project: { _id: 0 } },
    ])
    .toArray();
  return {
    required_skills: desiredSkills,
    results: results.map((profile) => ({
      ...profile,
      name: availableNames.get(profile.user_id),
      total_required: desiredSkills.length,
    })),
  };
});
