#!/bin/zsh
cd "$(dirname "$0")" || exit 1
if ! command -v java >/dev/null 2>&1; then
  echo '请先安装 JDK 17 或以上版本。'; read -k 1; exit 1
fi
echo '启动推理图鉴 Spring Boot，浏览器访问 http://localhost:'"${PORT:-8080}"
./mvnw spring-boot:run
