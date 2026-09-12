describe("Production Project Management Suite", () => {
  describe("Sprint Velocity & Story Points Calculations", () => {
    it("should compute sprint completed vs total story points accurately", () => {
      const sprintTasks = [
        { title: "Task 1", storyPoints: 3, status: "Done" },
        { title: "Task 2", storyPoints: 5, status: "Done" },
        { title: "Task 3", storyPoints: 8, status: "In Progress" },
        { title: "Task 4", storyPoints: 2, status: "Todo" },
      ];

      const totalStoryPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const completedStoryPoints = sprintTasks
        .filter((t) => t.status === "Done")
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      const progress = Math.round((completedStoryPoints / totalStoryPoints) * 100);

      expect(totalStoryPoints).toBe(18);
      expect(completedStoryPoints).toBe(8);
      expect(progress).toBe(44);
    });

    it("should handle sprints with 0 story points gracefully", () => {
      const sprintTasks: any[] = [];
      const totalStoryPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      expect(totalStoryPoints).toBe(0);
    });
  });

  describe("Time Tracking & Worklog Accumulation", () => {
    it("should sum logged work hours and calculate remaining against estimate", () => {
      const estimatedHours = 16;
      const timeLogs = [
        { hours: 2.5, description: "Initial setup" },
        { hours: 4.0, description: "Database schema" },
        { hours: 3.5, description: "API endpoints" },
      ];

      const actualHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
      const remainingHours = Math.max(0, estimatedHours - actualHours);
      const utilization = Math.round((actualHours / estimatedHours) * 100);

      expect(actualHours).toBe(10);
      expect(remainingHours).toBe(6);
      expect(utilization).toBe(63);
    });

    it("should flag when logged hours exceed original estimate", () => {
      const estimatedHours = 8;
      const actualHours = 10.5;

      const isOverEstimate = actualHours > estimatedHours;
      const excess = actualHours - estimatedHours;

      expect(isOverEstimate).toBe(true);
      expect(excess).toBe(2.5);
    });
  });

  describe("Team Workload & Capacity Planning", () => {
    it("should classify member capacity correctly based on 40h standard threshold", () => {
      const calculateStatus = (estimatedHours: number) => {
        if (estimatedHours < 25) return "under_allocated";
        if (estimatedHours > 40) return "over_allocated";
        return "optimal";
      };

      expect(calculateStatus(15)).toBe("under_allocated");
      expect(calculateStatus(35)).toBe("optimal");
      expect(calculateStatus(48)).toBe("over_allocated");
      expect(calculateStatus(40)).toBe("optimal");
    });

    it("should compute team-wide allocated capacity percentage", () => {
      const teamAllocations = [
        { member: "Alice", hours: 35 },
        { member: "Bob", hours: 45 },
        { member: "Charlie", hours: 20 },
      ];

      const totalHours = teamAllocations.reduce((sum, a) => sum + a.hours, 0);
      const totalCapacity = teamAllocations.length * 40;
      const teamUtilization = Math.round((totalHours / totalCapacity) * 100);

      expect(totalHours).toBe(100);
      expect(totalCapacity).toBe(120);
      expect(teamUtilization).toBe(83);
    });
  });

  describe("Issue Types Taxonomy", () => {
    it("should validate supported agile issue types", () => {
      const validTypes = ["task", "bug", "feature", "story", "epic"];
      expect(validTypes.includes("bug")).toBe(true);
      expect(validTypes.includes("feature")).toBe(true);
      expect(validTypes.includes("epic")).toBe(true);
      expect(validTypes.includes("unknown")).toBe(false);
    });
  });

  describe("Automation Rule Evaluation", () => {
    it("should match trigger and conditions for urgent bugs routing", () => {
      const rule = {
        trigger: "task.created",
        condition: { field: "priority", operator: "equals", value: "Urgent" },
      };

      const incomingEvent = {
        event: "task.created",
        task: { priority: "Urgent", issueType: "bug" },
      };

      const isMatch =
        incomingEvent.event === rule.trigger &&
        incomingEvent.task.priority === rule.condition.value;

      expect(isMatch).toBe(true);
    });
  });
});
