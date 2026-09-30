import { EntityManager } from 'typeorm';
import { User } from '../../user/entity/user.entity';

/**
 * Generates the next sequential VED ID using PostgreSQL's atomic sequence `ved_id_seq`.
 * Formatted with 6 leading zeros (e.g., VED000004, VED000005, etc.), matching Founders (VED000001 - VED000003).
 * Naturally expands to 7+ digits as user base grows (10M+ users).
 */
export async function generateNextVedId(manager: EntityManager): Promise<string> {
  const userRepo = manager.getRepository(User);

  while (true) {
    const result = await manager.query("SELECT nextval('ved_id_seq') as next_val");
    const num = result[0]?.next_val;
    const candidate = `VED${String(num).padStart(6, '0')}`;

    // Extra safety guard: ensure no collision with any legacy manual/random IDs
    const exists = await userRepo.findOne({ where: { vedId: candidate } });
    if (!exists) {
      return candidate;
    }
  }
}
