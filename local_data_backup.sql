SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '0beff3ec-0019-4e44-a909-f508c4a62da0', '{"action":"user_confirmation_requested","actor_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-06-07 15:36:04.091007+00', ''),
	('00000000-0000-0000-0000-000000000000', '570364fd-fe4e-41e3-89e2-802069ae5963', '{"action":"user_signedup","actor_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"team"}', '2025-06-07 15:38:09.07488+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f82d5bb6-dbf5-4067-90cb-0beca70c3272', '{"action":"login","actor_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 15:38:17.704478+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b9f2ead6-2124-4f24-a671-7e1f8650e0b9', '{"action":"logout","actor_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 15:43:26.733414+00', ''),
	('00000000-0000-0000-0000-000000000000', '3435bc9b-edde-4147-a9ea-beb0025f6463', '{"action":"login","actor_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 15:44:26.787936+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a2f51c62-9798-418c-8e5c-27cbb401e03b', '{"action":"logout","actor_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 16:35:54.745792+00', ''),
	('00000000-0000-0000-0000-000000000000', '0d93bbcb-a1b1-4fd3-bb0c-ae14ed4637e8', '{"action":"login","actor_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 16:36:09.546498+00', ''),
	('00000000-0000-0000-0000-000000000000', '6c115678-068a-4f35-a394-1d5643eb1128', '{"action":"logout","actor_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 17:04:37.726514+00', ''),
	('00000000-0000-0000-0000-000000000000', '9dff5015-2388-4adb-8277-c37077c688ce', '{"action":"login","actor_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 17:04:55.622313+00', ''),
	('00000000-0000-0000-0000-000000000000', '8945daf7-9769-4a35-84fd-8bc1b1ad04b0', '{"action":"logout","actor_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 17:13:00.603455+00', ''),
	('00000000-0000-0000-0000-000000000000', '8b54a5e1-ea69-4fb7-9fd4-6b7644f8dbb5', '{"action":"user_confirmation_requested","actor_id":"efc697d1-d2c0-4e1b-88cf-a3ec943bb447","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-06-07 17:13:37.879779+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e401bc3-72ec-491e-b549-5bb999bb0afd', '{"action":"user_signedup","actor_id":"efc697d1-d2c0-4e1b-88cf-a3ec943bb447","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"team"}', '2025-06-07 17:14:05.297663+00', ''),
	('00000000-0000-0000-0000-000000000000', '2aff69ef-8524-4fd7-98f8-437e7cd91b84', '{"action":"login","actor_id":"efc697d1-d2c0-4e1b-88cf-a3ec943bb447","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 17:14:11.654427+00', ''),
	('00000000-0000-0000-0000-000000000000', '0487f35e-3729-417a-a98b-0c22538408f3', '{"action":"logout","actor_id":"efc697d1-d2c0-4e1b-88cf-a3ec943bb447","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 17:14:18.964871+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f4a61be7-0738-4ea8-bd9e-923a4e3d2ea8', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"podemopo123@gmail.com","user_id":"efc697d1-d2c0-4e1b-88cf-a3ec943bb447","user_phone":""}}', '2025-06-07 17:16:13.762389+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bf3ea4cd-03e6-48ca-b1f2-3a3342688d73', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"podemopo@gmail.com","user_id":"a2d9baab-6cf8-4683-aafa-6e604253d2ae","user_phone":""}}', '2025-06-07 17:16:21.055743+00', ''),
	('00000000-0000-0000-0000-000000000000', '451f6d31-2d39-4f3d-a96e-16962bca43f5', '{"action":"user_confirmation_requested","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-06-07 17:16:49.237497+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b8a600e1-d38c-452f-acd1-a31bc61b4318', '{"action":"user_signedup","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"team"}', '2025-06-07 17:17:18.336945+00', ''),
	('00000000-0000-0000-0000-000000000000', '114f7e49-98a1-4693-9016-013f1d0c7556', '{"action":"login","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 17:17:27.715397+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e119b09-5f1f-4d01-80ef-294e392806bd', '{"action":"token_refreshed","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-07 18:58:56.161694+00', ''),
	('00000000-0000-0000-0000-000000000000', '44e945cc-3a5c-4ec5-add1-1a4595057665', '{"action":"token_revoked","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-07 18:58:56.162965+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cfe071bd-ed35-4eb6-aa0a-b2a22884c112', '{"action":"login","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 18:59:38.444821+00', ''),
	('00000000-0000-0000-0000-000000000000', '178fbb9e-d6bf-4560-a000-8bb8104703e7', '{"action":"logout","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 19:18:20.955632+00', ''),
	('00000000-0000-0000-0000-000000000000', '6a0c758c-b79a-4eaf-be49-c13056ee8567', '{"action":"login","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 19:24:22.733107+00', ''),
	('00000000-0000-0000-0000-000000000000', '31448305-ef97-4fe4-9e78-46efc7805384', '{"action":"logout","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 19:40:17.891927+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fe11bb92-36eb-44e9-8871-4b7483514c0b', '{"action":"login","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 19:40:37.009399+00', ''),
	('00000000-0000-0000-0000-000000000000', '1de6f0e8-5a53-47c8-b9a3-e3ed1917f0d3', '{"action":"logout","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 19:47:34.236813+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dcd3e81e-1674-4450-9e37-562774de15a2', '{"action":"user_signedup","actor_id":"e4275003-3071-4be2-85ed-347c1e9e6413","actor_username":"podemopoa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-06-07 19:48:09.144829+00', ''),
	('00000000-0000-0000-0000-000000000000', '89f6544c-92fc-40a9-9e71-3140b76004e1', '{"action":"login","actor_id":"e4275003-3071-4be2-85ed-347c1e9e6413","actor_username":"podemopoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 19:48:09.149194+00', ''),
	('00000000-0000-0000-0000-000000000000', '95eb659c-bf7a-4671-99fa-a02722be17e7', '{"action":"logout","actor_id":"e4275003-3071-4be2-85ed-347c1e9e6413","actor_username":"podemopoa@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 19:48:20.937893+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e2e1b6e3-5e76-46aa-bdb3-d69c7dd51b98', '{"action":"login","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 19:56:22.667885+00', ''),
	('00000000-0000-0000-0000-000000000000', '4604591e-41fa-4905-b36b-83163dd8dd88', '{"action":"logout","actor_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","actor_username":"podemopo123@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 19:56:54.966665+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fed513a3-9d0c-4e5e-83f8-73a1d24efcb7', '{"action":"user_signedup","actor_id":"9d960871-d327-4f3d-bba1-fdbb7d215f60","actor_username":"gdhsjs@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-06-07 19:57:10.382681+00', ''),
	('00000000-0000-0000-0000-000000000000', '04887c06-8a34-42d8-b564-cef3f89ad3ff', '{"action":"login","actor_id":"9d960871-d327-4f3d-bba1-fdbb7d215f60","actor_username":"gdhsjs@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 19:57:10.388579+00', ''),
	('00000000-0000-0000-0000-000000000000', '14c56331-11fc-48d7-b6ce-7087c4949710', '{"action":"logout","actor_id":"9d960871-d327-4f3d-bba1-fdbb7d215f60","actor_username":"gdhsjs@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 19:57:26.667127+00', ''),
	('00000000-0000-0000-0000-000000000000', '604cfbb5-74dc-4d54-a4cd-7bc78229649c', '{"action":"user_signedup","actor_id":"ba1f371f-d42b-45ff-b2a0-813d52083a6d","actor_username":"podema@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-06-07 19:59:26.641779+00', ''),
	('00000000-0000-0000-0000-000000000000', '1a78b32d-a0b9-4ff0-9602-6a305aed55d1', '{"action":"login","actor_id":"ba1f371f-d42b-45ff-b2a0-813d52083a6d","actor_username":"podema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 19:59:26.646303+00', ''),
	('00000000-0000-0000-0000-000000000000', '186b8107-f68f-4bc8-9b59-3bf764185977', '{"action":"user_repeated_signup","actor_id":"ba1f371f-d42b-45ff-b2a0-813d52083a6d","actor_username":"podema@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-06-07 19:59:31.66001+00', ''),
	('00000000-0000-0000-0000-000000000000', '3ea8b17d-a5af-4bfb-b598-19ea94e35076', '{"action":"login","actor_id":"ba1f371f-d42b-45ff-b2a0-813d52083a6d","actor_username":"podema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 19:59:35.619855+00', ''),
	('00000000-0000-0000-0000-000000000000', '72c64a95-5b04-43bd-96d9-42f78c0d31fe', '{"action":"logout","actor_id":"ba1f371f-d42b-45ff-b2a0-813d52083a6d","actor_username":"podema@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 19:59:42.381459+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af43f386-72c9-4d3a-b991-caac22f8a66f', '{"action":"user_signedup","actor_id":"6f1a5dd3-5d4d-4451-a919-5e346abbd7bb","actor_username":"rennieldsv@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-06-07 20:07:52.955104+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f7079312-a808-49be-9a79-a1cb4be20bb7', '{"action":"login","actor_id":"6f1a5dd3-5d4d-4451-a919-5e346abbd7bb","actor_username":"rennieldsv@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 20:07:52.960384+00', ''),
	('00000000-0000-0000-0000-000000000000', '0c527405-974a-49d6-b18b-e822c6294f9d', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"rennieldsv@gmail.com","user_id":"6f1a5dd3-5d4d-4451-a919-5e346abbd7bb","user_phone":""}}', '2025-06-07 20:10:15.851744+00', ''),
	('00000000-0000-0000-0000-000000000000', '3f0ecbd4-5477-43da-8f00-fef4cbfc0e15', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"podema@gmail.com","user_id":"ba1f371f-d42b-45ff-b2a0-813d52083a6d","user_phone":""}}', '2025-06-07 20:10:23.35003+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f1a5c258-a0aa-43e7-aba0-b6c3478149aa', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"gdhsjs@gmail.com","user_id":"9d960871-d327-4f3d-bba1-fdbb7d215f60","user_phone":""}}', '2025-06-07 20:10:30.623219+00', ''),
	('00000000-0000-0000-0000-000000000000', '65714234-09cb-4d0b-ac5a-67cde683d86f', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"podemopoa@gmail.com","user_id":"e4275003-3071-4be2-85ed-347c1e9e6413","user_phone":""}}', '2025-06-07 20:10:37.664855+00', ''),
	('00000000-0000-0000-0000-000000000000', '96c0f7fb-310a-4cb3-92a2-5dfeee8b0b13', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"podemopo123@gmail.com","user_id":"162ff607-a13f-4ff5-8a66-388fdba95c12","user_phone":""}}', '2025-06-07 20:10:44.505005+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf2be06b-6f8b-476a-bba0-882a62675e71', '{"action":"user_signedup","actor_id":"03afa896-8b01-42c4-9348-e1138533fc50","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-06-07 20:14:09.000615+00', ''),
	('00000000-0000-0000-0000-000000000000', '1c9b0541-2d9c-47e1-81db-d2b92bb28ad6', '{"action":"login","actor_id":"03afa896-8b01-42c4-9348-e1138533fc50","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 20:14:09.005949+00', ''),
	('00000000-0000-0000-0000-000000000000', '7c972249-6262-440c-b934-b564314d0e0c', '{"action":"logout","actor_id":"03afa896-8b01-42c4-9348-e1138533fc50","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 20:14:59.071004+00', ''),
	('00000000-0000-0000-0000-000000000000', '81a7f828-a8cf-43e2-a901-68e3295f910c', '{"action":"user_signedup","actor_id":"845fb0bd-3636-4b7c-8611-a23b4ccf9324","actor_username":"renn@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-06-07 20:15:44.465832+00', ''),
	('00000000-0000-0000-0000-000000000000', '8ec248a0-afeb-4847-9b24-a8ac10eff396', '{"action":"login","actor_id":"845fb0bd-3636-4b7c-8611-a23b4ccf9324","actor_username":"renn@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 20:15:44.468886+00', ''),
	('00000000-0000-0000-0000-000000000000', '6c7be157-10c2-4c41-b6bd-61bbfdea0596', '{"action":"logout","actor_id":"845fb0bd-3636-4b7c-8611-a23b4ccf9324","actor_username":"renn@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 20:18:16.694083+00', ''),
	('00000000-0000-0000-0000-000000000000', '0ae92aa6-738f-474e-aeee-5226d463cef0', '{"action":"user_signedup","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-06-07 20:19:39.191515+00', ''),
	('00000000-0000-0000-0000-000000000000', '5a758924-7f5b-4171-9f13-cea5d551befc', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 20:19:39.196183+00', ''),
	('00000000-0000-0000-0000-000000000000', '9ae60b77-5885-4f79-a67e-c3982649fe6d', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 20:22:04.41363+00', ''),
	('00000000-0000-0000-0000-000000000000', 'abbea609-8b51-4bbc-bdc8-5098b9bf2d48', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 20:22:18.353365+00', ''),
	('00000000-0000-0000-0000-000000000000', '91dec5bb-b183-4a5c-b6ad-e54303be87ce', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 20:43:52.011157+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f9651172-a598-4e63-8569-4fce5ff3e432', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 20:45:09.100445+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a9368538-be12-41b2-a52c-60750814a34f', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-07 21:43:29.633995+00', ''),
	('00000000-0000-0000-0000-000000000000', '22ba85b7-3f65-4553-84fc-a630e2340ab9', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-07 21:43:29.6372+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b303f974-41fc-4f84-bb5a-e5f8681c9aca', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 22:17:35.312301+00', ''),
	('00000000-0000-0000-0000-000000000000', '4b891d61-d75f-4f4b-87f4-4231534ea4f1', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 22:17:56.827462+00', ''),
	('00000000-0000-0000-0000-000000000000', '147203a5-8c12-40af-8589-d437720e37d6', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 23:09:41.892667+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af9fd37b-2e67-47a8-8ad8-01fbc9ae1dd9', '{"action":"user_signedup","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-06-07 23:10:03.837273+00', ''),
	('00000000-0000-0000-0000-000000000000', '3cc34241-f775-4557-9cba-97ffea63adb7', '{"action":"login","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 23:10:03.840934+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bb00ba2f-f02a-4a50-a7df-1eb3d52492c6', '{"action":"logout","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 23:20:31.703064+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d39dd43-062d-4ad3-a8a8-66f8402c9344', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 23:20:46.861853+00', ''),
	('00000000-0000-0000-0000-000000000000', '3fb74a0f-7ee4-4cb3-aab7-581225a82512', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-07 23:32:51.676416+00', ''),
	('00000000-0000-0000-0000-000000000000', '596b678e-4217-4f46-8dab-218096bc248c', '{"action":"login","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-07 23:33:08.663514+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab5053e3-b543-4690-8fd2-8772e79d20eb', '{"action":"token_refreshed","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-08 09:14:59.912148+00', ''),
	('00000000-0000-0000-0000-000000000000', '6575da1f-f1cb-4eea-b1ac-8f44985b384e', '{"action":"token_revoked","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-08 09:14:59.920834+00', ''),
	('00000000-0000-0000-0000-000000000000', '55ea1864-46f5-4a8a-bcfe-3750e31c585c', '{"action":"logout","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-08 09:57:43.752244+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dc4f8715-d148-48f6-8b67-fb50ac07db22', '{"action":"login","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-08 09:58:03.163032+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cad9925e-c416-4177-b0c0-7a6b3bfa7b57', '{"action":"token_refreshed","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-08 11:32:29.758046+00', ''),
	('00000000-0000-0000-0000-000000000000', '7f164bcc-4c51-4c3f-bf24-365e79e533a5', '{"action":"token_revoked","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-08 11:32:29.759671+00', ''),
	('00000000-0000-0000-0000-000000000000', '74299ea8-2211-4aaa-a1ee-52f54cdca5fe', '{"action":"logout","actor_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","actor_username":"podem@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-08 11:38:16.342548+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f3eaef7e-a4d0-4f69-9772-9749930f78ff', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-08 11:38:29.692763+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cef7b2d8-b3db-40b6-b2b9-2e88f4badf50', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 05:18:35.57042+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cda6b7e0-594a-4f94-9998-0a747f45e930', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 05:18:35.576226+00', ''),
	('00000000-0000-0000-0000-000000000000', '9a8961a6-8b04-41a3-96de-ec79d09d6176', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 10:55:04.515807+00', ''),
	('00000000-0000-0000-0000-000000000000', '5236e51d-a9d3-440f-a665-977a17f4a56c', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 10:55:04.524914+00', ''),
	('00000000-0000-0000-0000-000000000000', '1b02297f-755e-49dc-a663-92b2f4b9c694', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 12:05:38.931544+00', ''),
	('00000000-0000-0000-0000-000000000000', '6c042651-7fef-4e32-8e09-08a68a322729', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 12:05:38.938714+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab646381-4e3a-4811-a74d-f0055d231b68', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 13:04:36.153903+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ae304cca-9eb2-4fcc-b359-b182aa157be6', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 13:04:36.156559+00', ''),
	('00000000-0000-0000-0000-000000000000', '41c93f6a-45bb-45d1-a20d-f911880f34af', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 14:11:36.610616+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c663f3de-d4ca-42bd-9161-610c8e52304e', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 14:11:36.613061+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e828175e-1a6b-4da5-a98f-fb76b3ddfe6b', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 15:12:47.7707+00', ''),
	('00000000-0000-0000-0000-000000000000', '31c16b2b-037d-4677-89e7-d7dfd0df3bdb', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 15:12:47.773234+00', ''),
	('00000000-0000-0000-0000-000000000000', '1a30dc94-8b06-455c-8152-8d3d0fbaf7b3', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 16:11:10.571047+00', ''),
	('00000000-0000-0000-0000-000000000000', '75637c45-87ce-4c06-96a5-b8715c1359e0', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 16:11:10.573503+00', ''),
	('00000000-0000-0000-0000-000000000000', '72108517-1ba0-488c-91c0-2aecee200be9', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-11 16:55:06.688733+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c983a4db-aac7-4238-a6c6-23d6f60c7247', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-11 16:55:50.48143+00', ''),
	('00000000-0000-0000-0000-000000000000', '7e1f064e-ec03-4819-b544-129a6a4ba3c6', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 18:14:47.634946+00', ''),
	('00000000-0000-0000-0000-000000000000', '275438f8-7095-45e3-9e36-05c6ffd396cf', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 18:14:47.635923+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ec301918-4423-4923-84ad-7be4088eae70', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-11 18:15:00.132414+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dce8daa2-d32e-4ec8-9ef1-481631d35e5c', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 20:22:22.968287+00', ''),
	('00000000-0000-0000-0000-000000000000', '396d70ef-115f-43e1-a97a-d109353a25e6', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-11 20:22:22.970868+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bfb89da6-005b-47f9-bdb0-acb4759d163e', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-11 20:25:41.812783+00', ''),
	('00000000-0000-0000-0000-000000000000', '2e70b7b4-7e27-471a-871e-9a817c4163d4', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 03:26:52.712732+00', ''),
	('00000000-0000-0000-0000-000000000000', '9b62c001-940c-413b-9d6d-4f36bdc1854a', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 03:26:52.718248+00', ''),
	('00000000-0000-0000-0000-000000000000', '52e57bbb-8fd4-46b8-acb5-a8a7edc8dd5a', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 03:26:54.762917+00', ''),
	('00000000-0000-0000-0000-000000000000', '342db88d-fe2d-4360-b808-ac386fcae4c8', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 03:39:59.883926+00', ''),
	('00000000-0000-0000-0000-000000000000', '9e40a654-12f0-4d2a-be0b-a05cd4d74cb9', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 03:45:21.686986+00', ''),
	('00000000-0000-0000-0000-000000000000', '459430ce-3a7e-4648-bdf9-5ad30fe09f97', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 04:54:41.502708+00', ''),
	('00000000-0000-0000-0000-000000000000', '285eaab0-03c3-4f38-8888-15ad0fc2b5e1', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 04:54:41.506947+00', ''),
	('00000000-0000-0000-0000-000000000000', '83b735cd-c6ec-494e-aac8-129d18f52f0c', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 05:16:23.131432+00', ''),
	('00000000-0000-0000-0000-000000000000', '76b3ba80-1ed7-45d5-a66a-3fa8c9ea1a02', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 05:16:52.102748+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd7c983c4-77f1-4b16-aba4-e18fb733a2b9', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 05:16:58.479405+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ac519948-26ee-488a-8c44-1817a1b38c5d', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 05:17:38.860648+00', ''),
	('00000000-0000-0000-0000-000000000000', '3fa3d6f3-1f51-4ac3-9bcf-3ad650bb7a78', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 05:18:54.315392+00', ''),
	('00000000-0000-0000-0000-000000000000', '38fb8a86-5fd6-4f17-89f7-f7964f4709b0', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 05:22:28.81308+00', ''),
	('00000000-0000-0000-0000-000000000000', '85288a14-bdd2-483e-b932-1ed0586c8d9a', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 05:24:11.986259+00', ''),
	('00000000-0000-0000-0000-000000000000', '66b77c2c-930a-45ba-8034-c5a540ba1dd1', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 05:24:59.053806+00', ''),
	('00000000-0000-0000-0000-000000000000', '99985738-16e5-45bb-897c-6cae0c32abb0', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 05:27:15.426111+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b9c733f1-aec4-49cc-b5b2-9e3dd42169cb', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 05:31:54.37323+00', ''),
	('00000000-0000-0000-0000-000000000000', '94258930-27a2-4ad1-8211-07ccd3427bc4', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 05:32:00.312087+00', ''),
	('00000000-0000-0000-0000-000000000000', '7cffd658-ae21-49c1-aac2-8edcd1a4ea36', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 05:33:43.361837+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e861a5a0-e271-422e-9a37-46d617761585', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 05:41:12.32924+00', ''),
	('00000000-0000-0000-0000-000000000000', '9a8c1f95-5344-49bc-8ed2-58bfa348f6a9', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 07:03:13.263513+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ef1c474-6439-4728-804c-febf8eb231fc', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 07:05:30.90494+00', ''),
	('00000000-0000-0000-0000-000000000000', '18cdd437-189a-4922-86ad-ce1f9acf1f94', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 07:06:05.293017+00', ''),
	('00000000-0000-0000-0000-000000000000', '0841925b-cae6-48d5-b7a4-763562df4262', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 07:06:25.992887+00', ''),
	('00000000-0000-0000-0000-000000000000', '0fc6d54e-ffde-4288-8a49-4052af7457c5', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 07:08:09.934798+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd25ce986-4219-4f60-a6e7-f1fc79f49fe6', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 08:06:10.141411+00', ''),
	('00000000-0000-0000-0000-000000000000', '1467ddd5-8964-4772-84c6-3195ee2ce2ef', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 08:06:10.146945+00', ''),
	('00000000-0000-0000-0000-000000000000', '426e869c-8e0a-49e0-a763-4df1b042f559', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 09:05:02.97033+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e1ab732d-54cc-4eab-9e1c-856e4dcf8c33', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 09:05:02.972789+00', ''),
	('00000000-0000-0000-0000-000000000000', '1d4990b0-d971-4c19-9a4e-008f7d9f1f61', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-12 09:48:07.158252+00', ''),
	('00000000-0000-0000-0000-000000000000', '14dd2721-0089-467c-9f53-39d937075aeb', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-12 09:50:24.318886+00', ''),
	('00000000-0000-0000-0000-000000000000', '4c7085ba-f25b-48cc-a3af-b25506c005c4', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 10:52:52.043775+00', ''),
	('00000000-0000-0000-0000-000000000000', '34d73860-9453-4fbe-9a71-bdbc94ad20cd', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 10:52:52.045832+00', ''),
	('00000000-0000-0000-0000-000000000000', '80712c1d-b60c-43be-a3e4-6f209012a99f', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 11:53:57.985616+00', ''),
	('00000000-0000-0000-0000-000000000000', '891ef11f-fff1-4da5-ab94-a0f2df548f98', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 11:53:57.989072+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ac02c5c0-4667-4292-bb3c-375ee45082bb', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 12:52:12.56663+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bf99e51e-0bac-46f9-9e61-57fc2281404c', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 12:52:12.576019+00', ''),
	('00000000-0000-0000-0000-000000000000', '171f5a9f-9fc1-4720-a3a1-4836be43a2ab', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 13:50:39.654132+00', ''),
	('00000000-0000-0000-0000-000000000000', '2141227f-3e91-4c33-a3a9-e07dc2ad65ec', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 13:50:39.656527+00', ''),
	('00000000-0000-0000-0000-000000000000', '0207bece-3ea1-45b2-b2b3-84f7abf8d9ee', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 15:05:45.47094+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cd4e245b-5ab6-4fcd-8e5a-10cb409e50e7', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 15:05:45.473372+00', ''),
	('00000000-0000-0000-0000-000000000000', '7d56e88d-8b73-44f6-8200-a404ad5ec98c', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 16:04:08.437009+00', ''),
	('00000000-0000-0000-0000-000000000000', '67c0e820-56b8-4638-b50c-87f93a8af1be', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-12 16:04:08.439119+00', ''),
	('00000000-0000-0000-0000-000000000000', '4b7451a6-e6d2-44f6-9c1a-12ff0ab63e54', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 10:20:04.142364+00', ''),
	('00000000-0000-0000-0000-000000000000', '1b8e7302-04c2-4769-b237-5dd12a1426aa', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 10:20:04.152708+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a9eb0a6b-ffc1-4084-a141-5f243434d720', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-14 11:12:14.002677+00', ''),
	('00000000-0000-0000-0000-000000000000', '3ef5d75e-9561-41eb-a768-bbfdd9930931', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-14 11:57:08.619112+00', ''),
	('00000000-0000-0000-0000-000000000000', '12b90d3e-09f7-4b0b-9876-111de403f97a', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-14 12:29:13.823214+00', ''),
	('00000000-0000-0000-0000-000000000000', 'be5641d8-e315-4949-a761-a2162467adc1', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-14 12:29:33.116311+00', ''),
	('00000000-0000-0000-0000-000000000000', 'befeb56f-c335-4cf2-9486-7d523eeaba18', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-14 12:42:56.591633+00', ''),
	('00000000-0000-0000-0000-000000000000', '81df882e-fe52-4ba0-83ca-a85004b56a77', '{"action":"login","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-14 12:59:10.080904+00', ''),
	('00000000-0000-0000-0000-000000000000', '8681beb0-c5d7-4df6-ab2a-ea9821bdd3e9', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 15:38:34.982576+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dcbad01e-dc2e-4c6c-8b16-c0ed54264628', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 15:38:34.986439+00', ''),
	('00000000-0000-0000-0000-000000000000', '23038509-b689-4865-acd4-b37580acd170', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 16:36:46.428277+00', ''),
	('00000000-0000-0000-0000-000000000000', '3213566d-47c3-489d-8310-5838c3abcbef', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 16:36:46.43281+00', ''),
	('00000000-0000-0000-0000-000000000000', '7d8e2c4a-6e60-4b4c-bf28-15f7c094a003', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 17:50:10.257662+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ab0a569-3945-4590-9d11-8183964b311c', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 17:50:10.259183+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd48595d4-c27c-433b-bf57-3fcdc9c90b05', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 20:59:13.773639+00', ''),
	('00000000-0000-0000-0000-000000000000', '7b9f1b93-053c-488a-a18d-b7a38a1bd6a5', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 20:59:13.777532+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd54fdb61-3c72-4b6d-b7fd-18bb01756f83', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 21:57:31.326503+00', ''),
	('00000000-0000-0000-0000-000000000000', '85309b70-0aed-45fa-a049-88ee87f9fce4', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 21:57:31.330495+00', ''),
	('00000000-0000-0000-0000-000000000000', '77e65df4-76cf-4cfb-bc6b-f1aaba8e6ee7', '{"action":"token_refreshed","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 23:01:48.64582+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b906d188-1e5c-45b6-8382-9def5e8bed2e', '{"action":"token_revoked","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-14 23:01:48.649766+00', ''),
	('00000000-0000-0000-0000-000000000000', '260256c1-1ae7-42c6-a48d-6a5818658ad6', '{"action":"logout","actor_id":"c8df60e6-bd12-4d30-b568-b481e8795249","actor_username":"podemopo12345@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-14 23:46:25.515984+00', ''),
	('00000000-0000-0000-0000-000000000000', '88cb8690-3fcf-46b5-98cb-a8248d78fbf7', '{"action":"login","actor_id":"03afa896-8b01-42c4-9348-e1138533fc50","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-14 23:46:54.189956+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f9fa31c3-292c-45f4-934f-9d388bbc4a4b', '{"action":"token_refreshed","actor_id":"03afa896-8b01-42c4-9348-e1138533fc50","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-15 08:31:24.632674+00', ''),
	('00000000-0000-0000-0000-000000000000', '13f99bb7-9c99-4b70-952d-6e7dc63d0259', '{"action":"token_revoked","actor_id":"03afa896-8b01-42c4-9348-e1138533fc50","actor_username":"podemopo@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-15 08:31:24.639026+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b05ef19b-837b-49f4-8e23-12086145c3cc', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"podem@gmail.com","user_id":"2ccc5fa4-f629-450f-be96-565f4af0dbc0","user_phone":""}}', '2025-06-18 11:54:50.46804+00', ''),
	('00000000-0000-0000-0000-000000000000', '672f3bee-6f83-4bec-a1a0-f9dbfee54463', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"renn@gmail.com","user_id":"845fb0bd-3636-4b7c-8611-a23b4ccf9324","user_phone":""}}', '2025-06-18 11:54:50.518787+00', ''),
	('00000000-0000-0000-0000-000000000000', '2eeec484-72a0-42bb-b69d-99860b6a0472', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"podemopo@gmail.com","user_id":"03afa896-8b01-42c4-9348-e1138533fc50","user_phone":""}}', '2025-06-18 11:54:51.318609+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'c8df60e6-bd12-4d30-b568-b481e8795249', 'authenticated', 'authenticated', 'podemopo12345@gmail.com', '$2a$10$i7ujo.0d0tD.BlWT1eH8YuGcQiWhXpUEDMtu1nEmwVR10FT.W/Bgu', '2025-06-07 20:19:39.192183+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-06-14 12:59:10.084416+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "c8df60e6-bd12-4d30-b568-b481e8795249", "email": "podemopo12345@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-06-07 20:19:39.183459+00', '2025-06-14 23:01:48.656412+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('c8df60e6-bd12-4d30-b568-b481e8795249', 'c8df60e6-bd12-4d30-b568-b481e8795249', '{"sub": "c8df60e6-bd12-4d30-b568-b481e8795249", "email": "podemopo12345@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-06-07 20:19:39.188287+00', '2025-06-07 20:19:39.188334+00', '2025-06-07 20:19:39.188334+00', 'caf8df9d-e823-4790-9170-d0b15ccda2f0');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."conversations" ("id", "created_at", "participant_ids", "last_message_text", "last_message_at", "participant1_last_read_at", "participant2_last_read_at") VALUES
	(1, '2025-06-07 23:10:17.861712+00', '{2ccc5fa4-f629-450f-be96-565f4af0dbc0,c8df60e6-bd12-4d30-b568-b481e8795249}', 'Sup', '2025-06-12 05:15:05.156+00', NULL, '2025-06-14 21:54:08.449+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "fullName", "username", "profilePhotoUrl", "email", "city", "bio", "business_address", "phone_number", "gender", "date_of_birth", "operation_hours") VALUES
	('c8df60e6-bd12-4d30-b568-b481e8795249', 'Renniel V. Delos Santos', 'Zion', 'https://hdfqfysrhlvpopevugvr.supabase.co/storage/v1/object/public/profilepicture/c8df60e6-bd12-4d30-b568-b481e8795249/1749334706409.jpg', 'podemopo12345@gmail.com', 'Quezon City', 'Follow me @Zion.x', '031 Gold st barangay Commonwealth Quezon City', '09665044369', 'Male', '2004-05-20', '[{"day": "Monday", "open": "09:00", "close": "17:00", "closed": false}, {"day": "Tuesday", "open": "Closed", "close": "Closed", "closed": true}, {"day": "Wednesday", "open": "09:00", "close": "17:00", "closed": false}, {"day": "Thursday", "open": "09:00", "close": "17:00", "closed": false}, {"day": "Friday", "open": "09:00", "close": "17:00", "closed": false}, {"day": "Saturday", "open": "Closed", "close": "Closed", "closed": true}, {"day": "Sunday", "open": "09:00", "close": "17:00", "closed": false}]');


--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."listings" ("id", "created_at", "item_name", "description", "price", "price_type", "categories", "is_new", "deal_method", "image_urls", "user_id") VALUES
	(12, '2025-06-07 22:19:45.158515+00', 'Ml for safe', 'pdjdjsjs', NULL, 'For Trade', '{"Audio Devices","Gaming Consoles & Accessories","Wearable Technology"}', true, 'Delivery', '{https://hdfqfysrhlvpopevugvr.supabase.co/storage/v1/object/public/itemimages/c8df60e6-bd12-4d30-b568-b481e8795249/1749334781866.jpg,https://hdfqfysrhlvpopevugvr.supabase.co/storage/v1/object/public/itemimages/c8df60e6-bd12-4d30-b568-b481e8795249/1749334781894.jpg,https://hdfqfysrhlvpopevugvr.supabase.co/storage/v1/object/public/itemimages/c8df60e6-bd12-4d30-b568-b481e8795249/1749334782119.png}', 'c8df60e6-bd12-4d30-b568-b481e8795249');


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."messages" ("id", "created_at", "conversation_id", "sender_id", "message_text") VALUES
	(36, '2025-06-12 05:15:04.911299+00', 1, 'c8df60e6-bd12-4d30-b568-b481e8795249', 'Sup');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id") VALUES
	('profilepicture', 'profilepicture', NULL, '2025-06-07 17:11:22.59615+00', '2025-06-07 17:11:22.59615+00', true, false, NULL, NULL, NULL),
	('itemimages', 'itemimages', NULL, '2025-06-07 21:03:27.218508+00', '2025-06-07 21:03:27.218508+00', true, false, NULL, NULL, NULL);


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 78, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."conversations_id_seq"', 1, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."favorites_id_seq"', 17, true);


--
-- Name: listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."listings_id_seq"', 16, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."messages_id_seq"', 36, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
