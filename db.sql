-- --------------------------------------------------------
-- 호스트:                          127.0.0.1
-- 서버 버전:                        11.8.3-MariaDB - mariadb.org binary distribution
-- 서버 OS:                        Win64
-- HeidiSQL 버전:                  12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- app 데이터베이스 구조 내보내기
CREATE DATABASE IF NOT EXISTS `app` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `app`;

-- 테이블 app.mission_complete 구조 내보내기
CREATE TABLE IF NOT EXISTS `mission_complete` (
  `ID` varchar(50) NOT NULL,
  `COMPLETE_DATE` datetime NOT NULL,
  PRIMARY KEY (`ID`),
  CONSTRAINT `mission_complete_ibfk_1` FOREIGN KEY (`ID`) REFERENCES `user` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 테이블 데이터 app.mission_complete:~0 rows (대략적) 내보내기

-- 테이블 app.quiz 구조 내보내기
CREATE TABLE IF NOT EXISTS `quiz` (
  `NO` int(11) NOT NULL AUTO_INCREMENT,
  `GROUP` varchar(50) DEFAULT NULL,
  `TITLE` varchar(150) DEFAULT NULL,
  `CONTENTS` varchar(3000) DEFAULT NULL,
  `OPTION_DISTINC` varchar(10) DEFAULT NULL,
  `OPTION1` varchar(200) DEFAULT NULL,
  `OPTION2` varchar(200) DEFAULT NULL,
  `OPTION3` varchar(200) DEFAULT NULL,
  `OPTION4` varchar(200) DEFAULT NULL,
  `ANSWER` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`NO`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 테이블 데이터 app.quiz:~5 rows (대략적) 내보내기
INSERT INTO `quiz` (`NO`, `GROUP`, `TITLE`, `CONTENTS`, `OPTION_DISTINC`, `OPTION1`, `OPTION2`, `OPTION3`, `OPTION4`, `ANSWER`) VALUES
	(1, 'Mission01', '테스트 문제', 'test', 'multiple', 'TEST01', 'TEST02', 'TEST03', 'TEST04', 'TEST01'),
	(2, 'Mission01', '테스트 02', 'test11', 'ox', NULL, NULL, NULL, NULL, 'O'),
	(4, 'Mission02', '미션2', '[관리자 화면] 강의에서 사용할 게임을 개발하고싶어. 크게 두가지로 개발할거야. 관리자 페이지와 사용자페이지야. 우선은 관리자페이지부터 개발을 할거야. 관리자페이지는 여러페이지로 구성이 될거야. 하나하나씩 나와 함께 개발을 해보자. - 관리자페이지 : 첫번째로 퀴즈 게임의 퀴즈를 등록할 화면이야. 퀴즈그룹(퀴즈를 그룹별로 관리), 퀴즈의 제목, 퀴즈내용 (3000글자 이내), 정답옵션구분 (단답형, 4지선다, OX로 구분) , 정답옵션 (정답옵션구분에 따라 4지선다 선택될 경우 4지선다의 내용을 등록할 수 있도록해줘.), 정답등록, 등록버튼, 문제추가버튼(클릭하면 아래에 위와같이 퀴즈를 등록할 화면이 나옴) DATABASE에 대해서 알려줄게 MARIA DB를 사용하고있고, 접속주소는 127.0.0.1:3306 이야. ID, PASSWORD는 root / root 야. DB이름은 APP 이고 테이블은 QUIZ야. QUIZ 테이블의 컬럼 구성은 아래와 같아 . NO(INT, PRIMARY KEY), GROUP(VARCHAR 50), TITLE(VARCHAR 150), CONTENTS(VARCHAR 3000), OPTION_DISTINC(VARCHAR 10, 옵션구분 항목), OPTION1(VARCHAR 200), OPTION2(VARCHAR 200), OPTION3VARCHAR 200), OPTION4(VARCHAR 200), ANSWER(VARCHAR200, 정답등록 컬럼) 위의 OPTION1~4 는 정답옵션구분이 4지 선다로 선택되어졌을 때 등록되어지는 컬럼이야. 웹 화면으로 볼수 있게 개발해줘 등록된 Quiz를 볼 수 있는 List 화면도 개발해줘. List 화면에 Quiz 등록 버튼을 눌러서 Quiz를 등록 할 수 있는 화면도 개발해줘. 디자인을 좀더 고급스럽고 사용자가 사용하기 쉽게 개발해줘. 지금 화면은 사용자가 사용하기에 너무 불편해. List 화면의 데이터를 클릭하면 상세보기화면으로 이동하지말고 List 화면에서 데이터가 보이고 수정도 가능하게 개발해줘 Type 항목은 목록으로 선택할 수 있게 해줘. 그리고 이 화면에서 새로운 Quiz를 등록 할 수 있게 해줘. Contents는 클릭하면 textarea 팝업형태로 떠서 사용자가 입력 할 수 있게 해줘. 그리고 제목표시줄은 가운데 정렬로 해줘 [사용자 화면 ] 사용자 화면을 개발해보려고해. 사용자 접속주소는 /user/index.html 이야. 첫 화면에 접속을 하면 로그인 페이지가 나와. id , password를 입력하고 로그인 버튼을 클릭하면 로그인이 되는 화면이야. 로그인 db는 동일 DB의 USER 테이블이야. USER 테이블의 컬럼은 ID, PASSWORD,TEL(사용자 전화번호), CREATE_DATE (최초 데이터 등록일시), MODIFY_DATE (데이터가 수정된 일시), USE_YN (값은 Y,N) 야. 모두 VARCHAR 50 이고 USE_YN만 CHAR 야. 사용자가 가입할 회원가입 페이지를 만들어주고, 회원가입되어있는 사용자가 로그인을 하면 ID, PASSWORD가 일치하고 USER\\_YN이 Y 인 경우에만 로그인이 되게 해줘. 로그인이 성공하면 화면은 다시 만들도록 내가 지시할게', 'short', NULL, NULL, NULL, NULL, '1'),
	(5, 'Mission03', '나의 이름은', '언제나 멋진 나의 이름은? 결국 최후에 웃는자가 승리자다.', 'short', NULL, NULL, NULL, NULL, '2'),
	(6, 'Mission04', 'TEST', 'TEST', 'short', NULL, NULL, NULL, NULL, '3');

-- 테이블 app.quiz_history 구조 내보내기
CREATE TABLE IF NOT EXISTS `quiz_history` (
  `ID` varchar(50) NOT NULL,
  `QUIZ_NO` int(11) NOT NULL,
  `SOLVED_DATE` datetime NOT NULL,
  PRIMARY KEY (`ID`,`QUIZ_NO`),
  KEY `QUIZ_NO` (`QUIZ_NO`),
  CONSTRAINT `quiz_history_ibfk_1` FOREIGN KEY (`ID`) REFERENCES `user` (`ID`),
  CONSTRAINT `quiz_history_ibfk_2` FOREIGN KEY (`QUIZ_NO`) REFERENCES `quiz` (`NO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 테이블 데이터 app.quiz_history:~0 rows (대략적) 내보내기

-- 테이블 app.system_settings 구조 내보내기
CREATE TABLE IF NOT EXISTS `system_settings` (
  `KEY` varchar(50) NOT NULL,
  `VALUE` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`KEY`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 테이블 데이터 app.system_settings:~1 rows (대략적) 내보내기
INSERT INTO `system_settings` (`KEY`, `VALUE`) VALUES
	('GAME_STARTED', 'Y');

-- 테이블 app.user 구조 내보내기
CREATE TABLE IF NOT EXISTS `user` (
  `ID` varchar(50) NOT NULL,
  `PASSWORD` varchar(50) DEFAULT NULL,
  `TEL` varchar(50) DEFAULT NULL,
  `CREAT_DATE` varchar(50) DEFAULT NULL,
  `MODIFY_DATE` varchar(50) DEFAULT NULL,
  `USE_YN` char(50) DEFAULT NULL,
  `LAST_LOGIN_DATE` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 테이블 데이터 app.user:~2 rows (대략적) 내보내기
INSERT INTO `user` (`ID`, `PASSWORD`, `TEL`, `CREAT_DATE`, `MODIFY_DATE`, `USE_YN`, `LAST_LOGIN_DATE`) VALUES
	('hhd777', '1052', '01058280987', '2025-12-02 00:59:46', '2025-12-02 00:59:46', 'Y', NULL),
	('test', '1052', '01058280988', '2025-12-02 05:12:11', '2025-12-02 05:12:11', 'Y', '2025-12-04 14:32:59');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
