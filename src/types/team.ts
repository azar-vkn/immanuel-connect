export interface Team {
  id: string;
  name: string;
  leaders: string[]; // User IDs of team leaders
  createdAt: string;
  updatedAt: string;
}
