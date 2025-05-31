
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  description?: string;
  hackathon_id: string;
  leader_id: string;
  invite_code?: string;
  tech_stack?: string[];
  looking_for_skills?: string[];
  max_members: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hackathon?: {
    title: string;
    start_date: string;
    end_date: string;
  };
  leader?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  members?: TeamMember[];
  member_count?: number;
  is_member?: boolean;
  is_leader?: boolean;
  has_pending_request?: boolean;
}

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'leader' | 'member';
  joined_at: string;
  user?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
    skills?: string[];
  };
}

interface JoinRequest {
  id: string;
  team_id: string;
  user_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  user?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
    skills?: string[];
  };
}

interface SupabaseTeamStore {
  teams: Team[];
  userTeams: Team[];
  joinRequests: JoinRequest[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchUserTeams: () => Promise<void>;
  fetchAvailableTeams: (hackathonId?: string) => Promise<void>;
  createTeam: (teamData: Partial<Team>) => Promise<Team | null>;
  joinTeamWithCode: (inviteCode: string) => Promise<boolean>;
  requestToJoinTeam: (teamId: string, message?: string) => Promise<boolean>;
  acceptJoinRequest: (requestId: string) => Promise<boolean>;
  rejectJoinRequest: (requestId: string) => Promise<boolean>;
  leaveTeam: (teamId: string) => Promise<boolean>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<boolean>;
  fetchTeamJoinRequests: (teamId: string) => Promise<void>;
  generateNewInviteCode: (teamId: string) => Promise<string | null>;
}

export const useSupabaseTeamStore = create<SupabaseTeamStore>((set, get) => ({
  teams: [],
  userTeams: [],
  joinRequests: [],
  isLoading: false,
  error: null,

  fetchUserTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get teams where user is a member
      const { data: userTeamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          hackathons(title, start_date, end_date),
          profiles!teams_leader_id_fkey(username, full_name, avatar_url),
          team_members(
            id,
            user_id,
            role,
            joined_at,
            profiles(username, full_name, avatar_url, skills)
          )
        `)
        .eq('team_members.user_id', user.id)
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      // Transform data
      const transformedTeams = userTeamsData?.map(team => ({
        ...team,
        hackathon: team.hackathons,
        leader: team.profiles,
        members: team.team_members?.map((member: any) => ({
          ...member,
          user: member.profiles
        })),
        member_count: team.team_members?.length || 0,
        is_member: true,
        is_leader: team.leader_id === user.id
      })) || [];

      set({ userTeams: transformedTeams, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchAvailableTeams: async (hackathonId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('teams')
        .select(`
          *,
          hackathons(title, start_date, end_date),
          profiles!teams_leader_id_fkey(username, full_name, avatar_url),
          team_members(
            id,
            user_id,
            role,
            joined_at,
            profiles(username, full_name, avatar_url, skills)
          ),
          team_join_requests!left(id, user_id, status)
        `)
        .eq('is_active', true)
        .neq('leader_id', user.id);

      if (hackathonId) {
        query = query.eq('hackathon_id', hackathonId);
      }

      const { data: teamsData, error: teamsError } = await query;
      if (teamsError) throw teamsError;

      // Transform data
      const transformedTeams = teamsData?.map(team => ({
        ...team,
        hackathon: team.hackathons,
        leader: team.profiles,
        members: team.team_members?.map((member: any) => ({
          ...member,
          user: member.profiles
        })),
        member_count: team.team_members?.length || 0,
        is_member: team.team_members?.some((member: any) => member.user_id === user.id),
        is_leader: false,
        has_pending_request: team.team_join_requests?.some(
          (req: any) => req.user_id === user.id && req.status === 'pending'
        )
      })) || [];

      set({ teams: transformedTeams, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createTeam: async (teamData: Partial<Team>) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          ...teamData,
          leader_id: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: newTeam.id,
          user_id: user.id,
          role: 'leader'
        });

      if (memberError) throw memberError;

      // Refresh user teams
      await get().fetchUserTeams();
      set({ isLoading: false });
      return newTeam;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  joinTeamWithCode: async (inviteCode: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Find team by invite code
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, max_members, team_members(count)')
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .single();

      if (teamError) throw new Error('Invalid invite code');

      // Check if team is full
      const memberCount = team.team_members?.[0]?.count || 0;
      if (memberCount >= team.max_members) {
        throw new Error('Team is full');
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this team');
      }

      // Join team
      const { error: joinError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) throw joinError;

      // Refresh data
      await get().fetchUserTeams();
      await get().fetchAvailableTeams();
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  requestToJoinTeam: async (teamId: string, message?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('team_join_requests')
        .insert({
          team_id: teamId,
          user_id: user.id,
          message: message || null,
          status: 'pending'
        });

      if (error) throw error;

      // Refresh available teams
      await get().fetchAvailableTeams();
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  acceptJoinRequest: async (requestId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get request details
      const { data: request, error: requestError } = await supabase
        .from('team_join_requests')
        .select('team_id, user_id')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Add user to team
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: request.team_id,
          user_id: request.user_id,
          role: 'member'
        });

      if (memberError) throw memberError;

      // Update request status
      const { error: updateError } = await supabase
        .from('team_join_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Refresh data
      await get().fetchTeamJoinRequests(request.team_id);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  rejectJoinRequest: async (requestId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('team_join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  leaveTeam: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh user teams
      await get().fetchUserTeams();
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  updateTeam: async (teamId: string, updates: Partial<Team>) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);

      if (error) throw error;

      // Refresh user teams
      await get().fetchUserTeams();
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  fetchTeamJoinRequests: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: requests, error } = await supabase
        .from('team_join_requests')
        .select(`
          *,
          profiles(username, full_name, avatar_url, skills)
        `)
        .eq('team_id', teamId)
        .eq('status', 'pending');

      if (error) throw error;

      const transformedRequests = requests?.map(request => ({
        ...request,
        user: request.profiles
      })) || [];

      set({ joinRequests: transformedRequests, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  generateNewInviteCode: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('generate_invite_code');
      if (error) throw error;

      const newCode = data;
      const { error: updateError } = await supabase
        .from('teams')
        .update({ invite_code: newCode })
        .eq('id', teamId);

      if (updateError) throw updateError;

      // Refresh user teams
      await get().fetchUserTeams();
      set({ isLoading: false });
      return newCode;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  }
}));
