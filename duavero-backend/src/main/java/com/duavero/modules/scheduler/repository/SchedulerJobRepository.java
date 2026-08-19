package com.duavero.modules.scheduler.repository;

import com.duavero.modules.scheduler.model.SchedulerJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SchedulerJobRepository extends JpaRepository<SchedulerJob, Long> {

    Optional<SchedulerJob> findByJobCode(String jobCode);

    boolean existsByJobCode(String jobCode);
}
