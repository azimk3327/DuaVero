package com.duavero.core.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.slf4j.MDC;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private String type;

    private String title;

    private int status;

    private String detail;

    private String instance;

    private String errorCode;

    @Builder.Default
    private Instant timestamp = Instant.now();

    @Builder.Default
    private String correlationId = MDC.get("correlationId");

    private Map<String, String> fieldErrors;

    private List<String> errorMessages;

    public static ErrorResponse of(int status, String title, String detail, String instance, String errorCode) {
        return ErrorResponse.builder()
                .type("https://duavero.com/errors/" + (errorCode != null ? errorCode.toLowerCase().replace('_', '-') : "general"))
                .title(title)
                .status(status)
                .detail(detail)
                .instance(instance)
                .errorCode(errorCode)
                .timestamp(Instant.now())
                .correlationId(MDC.get("correlationId"))
                .build();
    }
}
