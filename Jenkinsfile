pipeline {
    agent any

    environment {
        FRONT_IMAGE = 'orchard-aigc'
        FRONT_TAG = "${env.BUILD_NUMBER}"
        CONTAINER_NAME = 'orchard-aigc'
        // 宿主机端口:容器端口（容器内固定 3000，standalone server.js）
        HOST_PORT = '3000'
        CONTAINER_PORT = '3000'
        // .env 已提前上传到服务器
        ENV_FILE = '/home/www/orchard_aigc/.env'
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('拉取代码 Checkout') {
            steps {
                checkout scm
                sh """
                    echo "=== WebHook分支：${env.GIT_BRANCH}"
                """
            }
        }

        stage('构建Docker镜像') {
            steps {
                sh """
                    docker build -t ${FRONT_IMAGE}:${FRONT_TAG} .
                    docker tag ${FRONT_IMAGE}:${FRONT_TAG} ${FRONT_IMAGE}:latest
                    echo "✅ 镜像构建完成 ${FRONT_IMAGE}:${FRONT_TAG}"
                """
            }
        }

        stage('本地直接部署') {
            steps {
                script {
                    String realBranch = env.GIT_BRANCH.replace("origin/", "")
                    println("处理后分支：${realBranch}")

                    if (realBranch == 'master') {
                        println("✅ master分支，执行本地部署")
                        sh """
                            echo "停止旧容器"
                            docker stop ${CONTAINER_NAME} || true
                            docker rm ${CONTAINER_NAME} || true

                            echo "启动容器"
                            CONTAINER_ID=\$(docker run -d --name ${CONTAINER_NAME} \
                                -p ${HOST_PORT}:${CONTAINER_PORT} \
                                --env-file ${ENV_FILE} \
                                --restart unless-stopped \
                                ${FRONT_IMAGE}:${FRONT_TAG})
                            echo "容器ID: \${CONTAINER_ID}"

                            sleep 4
                            echo "==== 所有容器 ===="
                            docker ps -a | grep ${CONTAINER_NAME}

                            if ! docker ps --filter "name=${CONTAINER_NAME}" | grep ${CONTAINER_NAME} ; then
                                echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!"
                                echo "容器后台退出，打印应用日志"
                                echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!"
                                docker logs ${CONTAINER_NAME}
                                exit 1
                            fi

                            docker image prune -f
                            echo "✅ 服务正常运行"
                        """
                    } else {
                        println("❌ 非master分支，跳过部署")
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ 流水线执行成功！镜像版本：${FRONT_TAG}"
        }
        failure {
            echo "❌ 流水线执行失败，请查看上方应用崩溃日志"
        }
        always {
            cleanWs()
        }
    }
}
