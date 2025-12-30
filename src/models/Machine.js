import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Machine extends Model {
  static table = 'machines';
  @field('name') name;
  @field('type') type;
  @field('status') status;
  @field('tenant_id') tenantId;
}
