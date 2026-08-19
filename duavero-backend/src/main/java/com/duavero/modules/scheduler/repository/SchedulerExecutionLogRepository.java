package com.duavero.modules.scheduler.repository;

import com.duavero.modules.scheduler.model.SchedulerExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchedulerExecutionLogRepository extends JpaRepository<SchedulerExecutionLog, Long> {

    List<SchedulerExecutionLog> findTop50ByOrderByStartTimeDesc();

    List<SchedulerExecutionLog> findByJobCodeOrderByStartTimeDesc(String jobCode);
}
