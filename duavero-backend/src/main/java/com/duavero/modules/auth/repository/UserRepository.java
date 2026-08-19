package com.duavero.modules.auth.repository;

import com.duavero.modules.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    @Query("SELECT u FROM User u WHERE (LOWER(u.email) = LOWER(:identifier) OR u.phoneNumber = :identifier)")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

    @Query("SELECT u FROM User u WHERE (LOWER(u.email) = LOWER(:identifier) OR u.phoneNumber = :identifier) AND (u.tenantId = :tenantId OR (:tenantId IS NULL AND u.tenantId IS NULL))")
    Optional<User> findByIdentifierAndTenantId(@Param("identifier") String identifier, @Param("tenantId") Long tenantId);

    @Query("SELECT u FROM User u WHERE u.email = :email AND (u.tenantId = :tenantId OR (:tenantId IS NULL AND u.tenantId IS NULL))")
    Optional<User> findByEmailAndTenantId(@Param("email") String email, @Param("tenantId") Long tenantId);

    boolean existsByEmail(String email);

    boolean existsByEmailAndTenantId(String email, Long tenantId);

    java.util.List<User> findByTenantId(Long tenantId);

    Optional<User> findByIdAndTenantId(Long id, Long tenantId);

    long countByTenantId(Long tenantId);
}
