#!/bin/zsh
cd "$(dirname "$0")"
if ! command -v java >/dev/null 2>&1; then
  echo '请先安装 Java 17 或以上版本。'; read -k 1; exit 1
fi
echo '启动谜境，浏览器访问 http://localhost:8080'
java --add-modules jdk.httpserver backend/src/MijingServer.java "$PWD" 8080
