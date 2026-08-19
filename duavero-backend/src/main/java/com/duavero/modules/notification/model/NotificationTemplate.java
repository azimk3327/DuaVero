package com.duavero.modules.notification.model;

import com.duavero.core.context.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_templates")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationTemplate extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "event_code", nullable = false, length = 80)
    private String eventCode;

    @Column(name = "channel", nullable = false, length = 30)
    private String channel; // EMAIL, SMS, WHATSAPP, IN_APP

    @Column(name = "subject", length = 255)
    private String subject;

    @Column(name = "body_template", nullable = false, columnDefinition = "TEXT")
    private String bodyTemplate;

    @Column(name = "allowed_variables_json", columnDefinition = "JSON")
    private String allowedVariablesJson;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
