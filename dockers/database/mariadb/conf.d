[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4

[mysqld]
character-set-client-handshake = FALSE
character-set-server           = utf8mb4
collation-server               = utf8mb4_unicode_ci
max_connections=300
max_allowed_packet=16M
bind-address=0.0.0.0

datadir=/var/lib/mysql
general_log            = 1
slow_query_log         = 1
long_query_time        = 5

log_error=/var/log/mysql/error.log
slow_query_log_file=/var/log/mysql/slow.log
general_log_file=/var/log/mysql/mysql.log
default_time_zone=Asia/Seoul
