# General
Version info
logging levels
listeners
healthcheck
reset counters
routes???

# Clusters

Cluster Name
cluster config - default/high priority
    max_connections
    max_pending_requests
    max_requests
    max_retries
each host
    Connections
        max_connections
        cx_active
        cx_total
        cx_connect_fail
    Requests
        max_requests
        max_pending_requests
        rq_active
        rq_error
        rq_success
        rq_timeout
        rq_total
    Config
        health_flags
        weight
        region
        zone
        sub_zone
        canary
        success_rate
        max_retries
    
# Stats

## Cluster
    Each cluster
        bind_errors
        max_host_weight
        membership_change
        membership_healthy
        membership_total
        retry_or_shadow_abandoned
        update_attempt
        update_empty
        update_failure
        update_rejected
        update_success
        external
            upstream_rq_200
            upstream_rq_2xx
            upstream_rq_304
            upstream_rq_3xx
            upstream_rq_404
            upstream_rq_4xx
        lb
            healthy_panic
            local_cluster_not_ok
            recalculate_zone_structures
            subsets_active
            subsets_created
            subsets_fallback
            subsets_removed
            subsets_selected
            zone_cluster_too_small
            zone_no_capacity_left
            zone_number_differs
            zone_routing_all_directly
            zone_routing_cross_zone
            zone_routing_sampled
        upstream
            cx
                active
                close_notify
                connect_attempts_exceeded
                connect_fail
                connect_timeout
                destroy
                destroy_local
                destroy_local_with_active_rq
                destroy_remote
                destroy_remote_with_active_rq
                destroy_with_active_rq
                http1_total
                http2_total
                max_requests
                none_healthy
                overflow
                protocol_error
                rx_bytes_buffered
                rx_bytes_total
                total
                tx_bytes_buffered
                tx_bytes_total
            flow_control
                backed_up_total
                drained_total
                paused_reading_total
                resumed_reading_total
            rq
                200
                2xx
                304
                3xx
                404
                4xx
                active
                cancelled
                maintenance_mode
                pending_active
                pending_failure_eject
                pending_overflow
                pending_total
                per_try_timeout
                retry
                retry_overflow
                retry_success
                rx_reset
                timeout
                total
                tx_reset
            version
        
## Http
    <Domain>
        downstream
            cx
                active
                destroy
                destroy_active_rq
                destroy_local
                destroy_local_active_rq
                destroy_remote
                destroy_remote_active_rq
                drain_close
                http1_active
                http1_total
                http2_active
                http2_total
                idle_timeout
                protocol_error
                rx_bytes_buffered
                rx_bytes_total
                ssl_active
                ssl_total
                total
                tx_bytes_buffered
                tx_bytes_total
                websocket_active
                websocket_total
            flow_control
                paused_reading_total
                resumed_reading_total
            rq
                2xx
                3xx
                4xx
                5xx
                active
                http1_total
                http2_total
                non_relative_path
                response_before_rq_complete
                rx_reset
                too_large
                total
                tx_reset
                ws_on_non_ws_route
        no_cluster
        no_route
        rds
            <domain>
                config_reload
                update_attempt
                update_empty
                update_failure
                update_rejected
                update_success
                version
        rq_redirect
        rq_total
        rs_too_large
        tracing
            client_enabled
            health_check
            not_traceable
            random_sampling
            service_forced
## Listener
    <listener>
        downstream
            cx
                active
                destroy
                proxy_proto_error
                total
            http
                <domain>
                    downstream
                        rq
                            2xx
                            3xx
                            4xx
                            5xx
    admin
        downstream
            cx
                active
                destroy
                proxy_proto_error
                total

## Listener Manager
    lds
        update_attempt
        update_failure
        update_rejected
        update_success
        version
    listener
        added
        create_failure
        create_success
        modified
        removed
    total
        listeners_active
        listeners_draining
        listeners_warming
        
## Server
    days_until_first_cert_expiring
    live
    memory_allocated
    memory_heap_size
    parent_connections
    total_connections
    uptime
    version
    watchdog_mega_miss
    watchdog_miss
    
# Listeners

# Logs

# Server Info

