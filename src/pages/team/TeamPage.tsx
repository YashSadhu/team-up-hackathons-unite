
import React from 'react';
import { useParams } from 'react-router-dom';
import TeamDashboard from '@/components/team/TeamDashboard';
import { toast } from 'sonner';

const TeamPage = () => {
  const { teamId } = useParams();

  const handleMemberAction = (memberId: string, action: string) => {
    toast.info(`Action ${action} triggered for member ${memberId}`);
  };

  const handleMilestoneUpdate = (milestoneId: string, status: string) => {
    toast.info(`Milestone ${milestoneId} status updated to ${status}`);
  };

  // Mock handlers for all required props
  const handleUpdateProfile = async (data: any) => {
    console.log('Update profile:', data);
    toast.info('Profile updated successfully');
  };

  const handleAddSkill = async (skill: any) => {
    console.log('Add skill:', skill);
    toast.info('Skill added successfully');
  };

  const handleRemoveSkill = async (skillName: string) => {
    console.log('Remove skill:', skillName);
    toast.info('Skill removed successfully');
  };

  const handleAddProject = async (project: any) => {
    console.log('Add project:', project);
    toast.info('Project added successfully');
  };

  const handleAddExperience = async (experience: any) => {
    console.log('Add experience:', experience);
    toast.info('Experience added successfully');
  };

  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    console.log('Update member role:', memberId, role);
    toast.info('Member role updated successfully');
  };

  const handleUpdateMemberPermissions = async (memberId: string, permissions: any) => {
    console.log('Update member permissions:', memberId, permissions);
    toast.info('Member permissions updated successfully');
  };

  const handleRemoveMember = async (memberId: string) => {
    console.log('Remove member:', memberId);
    toast.info('Member removed successfully');
  };

  const handleAddTask = async (task: any) => {
    console.log('Add task:', task);
    toast.info('Task added successfully');
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    console.log('Update task status:', taskId, status);
    toast.info('Task status updated successfully');
  };

  const handleUpdateTaskProgress = async (taskId: string, progress: number) => {
    console.log('Update task progress:', taskId, progress);
    toast.info('Task progress updated successfully');
  };

  const handleDeleteTask = async (taskId: string) => {
    console.log('Delete task:', taskId);
    toast.info('Task deleted successfully');
  };

  const handleUploadFile = async (file: File): Promise<string> => {
    console.log('Upload file:', file);
    toast.info('File uploaded successfully');
    return 'mock-file-url';
  };

  const handleDeleteFile = async (fileId: string) => {
    console.log('Delete file:', fileId);
    toast.info('File deleted successfully');
  };

  const handleShareFile = async (fileId: string, userIds: string[]) => {
    console.log('Share file:', fileId, userIds);
    toast.info('File shared successfully');
  };

  const handleDownloadFile = async (fileId: string) => {
    console.log('Download file:', fileId);
    toast.info('File downloaded successfully');
  };

  const handleSendMessage = async (message: any) => {
    console.log('Send message:', message);
    toast.info('Message sent successfully');
  };

  const handleTaskCreate = async (task: any) => {
    console.log('Create task:', task);
    toast.info('Task created successfully');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <TeamDashboard
        teamId={teamId || '1'}
        userId="current-user-123"
        onUpdateProfile={handleUpdateProfile}
        onAddSkill={handleAddSkill}
        onRemoveSkill={handleRemoveSkill}
        onAddProject={handleAddProject}
        onAddExperience={handleAddExperience}
        onUpdateMemberRole={handleUpdateMemberRole}
        onUpdateMemberPermissions={handleUpdateMemberPermissions}
        onRemoveMember={handleRemoveMember}
        onAddTask={handleAddTask}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        onUpdateTaskProgress={handleUpdateTaskProgress}
        onDeleteTask={handleDeleteTask}
        onUploadFile={handleUploadFile}
        onDeleteFile={handleDeleteFile}
        onShareFile={handleShareFile}
        onDownloadFile={handleDownloadFile}
        onSendMessage={handleSendMessage}
        onTaskCreate={handleTaskCreate}
      />
    </div>
  );
};

export default TeamPage;
