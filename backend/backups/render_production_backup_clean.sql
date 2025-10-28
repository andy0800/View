--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

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

DROP DATABASE IF EXISTS adrewards;
--
-- Name: adrewards; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE adrewards WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE adrewards OWNER TO postgres;

\connect adrewards

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
-- Name: enum_ad_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_ad_status AS ENUM (
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'active',
    'paused',
    'completed',
    'expired'
);


ALTER TYPE public.enum_ad_status OWNER TO postgres;

--
-- Name: enum_transactions_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_transactions_type AS ENUM (
    'deposit',
    'withdrawal',
    'view_reward',
    'ad_charge',
    'transfer'
);


ALTER TYPE public.enum_transactions_type OWNER TO postgres;

--
-- Name: enum_users_kyc_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_kyc_status AS ENUM (
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE public.enum_users_kyc_status OWNER TO postgres;

--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_role AS ENUM (
    'viewer',
    'advertiser',
    'admin'
);


ALTER TYPE public.enum_users_role OWNER TO postgres;

--
-- Name: enum_verification_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_verification_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.enum_verification_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ad_appeals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ad_appeals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    advertiser_id uuid NOT NULL,
    reason text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    admin_response text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ad_appeals OWNER TO postgres;

--
-- Name: ad_verification_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ad_verification_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    admin_id uuid NOT NULL,
    status public.enum_verification_status NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ad_verification_history OWNER TO postgres;

--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(255) NOT NULL,
    value text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_settings OWNER TO postgres;

--
-- Name: ads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    advertiser_id uuid NOT NULL,
    package_id integer NOT NULL,
    purchased_package_id uuid NOT NULL,
    media_url character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    section character varying(50) DEFAULT 'general'::character varying NOT NULL,
    status public.enum_ad_status DEFAULT 'draft'::public.enum_ad_status NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    verification_status public.enum_verification_status DEFAULT 'pending'::public.enum_verification_status NOT NULL,
    image_key character varying(255),
    link character varying(255),
    cta_link character varying(255),
    cta_text character varying(100) DEFAULT 'Learn More'::character varying,
    cta_enabled boolean DEFAULT true NOT NULL,
    budget numeric(10,3) DEFAULT 0 NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    spent numeric(10,3) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ads OWNER TO postgres;

--
-- Name: advertiser_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advertiser_packages (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    duration integer NOT NULL,
    price_per_view_micro bigint NOT NULL,
    viewer_reward_percentage numeric(5,2) DEFAULT 50.00 NOT NULL,
    company_share_percentage numeric(5,2) DEFAULT 50.00 NOT NULL,
    estimated_views integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.advertiser_packages OWNER TO postgres;

--
-- Name: advertiser_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.advertiser_packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.advertiser_packages_id_seq OWNER TO postgres;

--
-- Name: advertiser_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.advertiser_packages_id_seq OWNED BY public.advertiser_packages.id;


--
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    comment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comment_likes OWNER TO postgres;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    likes_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: company_wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    balance_micro bigint DEFAULT 0 NOT NULL,
    balance numeric(10,3) DEFAULT 0 NOT NULL,
    total_fees_collected_micro bigint DEFAULT 0 NOT NULL,
    total_fees_collected numeric(10,3) DEFAULT 0 NOT NULL,
    total_rewards_paid_micro bigint DEFAULT 0 NOT NULL,
    total_rewards_paid numeric(10,3) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.company_wallets OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.otp_codes OWNER TO postgres;

--
-- Name: purchased_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchased_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    advertiser_id uuid NOT NULL,
    package_id integer NOT NULL,
    purchased_budget_micro bigint NOT NULL,
    remaining_budget_micro bigint NOT NULL,
    used_budget_micro bigint DEFAULT 0 NOT NULL,
    purchased_budget numeric(10,3) NOT NULL,
    remaining_budget numeric(10,3) NOT NULL,
    used_budget numeric(10,3) DEFAULT 0 NOT NULL,
    estimated_views integer NOT NULL,
    views_completed integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    purchased_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.purchased_packages OWNER TO postgres;

--
-- Name: sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    icon character varying(100),
    color character varying(20),
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sections OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    from_wallet_id uuid,
    to_wallet_id uuid,
    amount_micro bigint NOT NULL,
    amount numeric(10,3) NOT NULL,
    type public.enum_transactions_type NOT NULL,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    transaction_category character varying(50),
    reference character varying(255),
    reference_id character varying(255),
    meta jsonb,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    civil_id character varying(255),
    phone character varying(255) NOT NULL,
    role public.enum_users_role NOT NULL,
    kyc_status public.enum_users_kyc_status DEFAULT 'pending'::public.enum_users_kyc_status,
    civil_front_key character varying(255),
    civil_back_key character varying(255),
    company_name character varying(255),
    license_number character varying(255),
    signatory_name character varying(255),
    license_doc_key character varying(255),
    verified_at timestamp without time zone,
    email character varying(255),
    commercial_registration_number character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: videos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url character varying(255) NOT NULL,
    title character varying(255),
    size integer,
    user_id uuid,
    ad_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.videos OWNER TO postgres;

--
-- Name: view_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.view_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    user_id uuid NOT NULL,
    purchased_package_id uuid NOT NULL,
    package_id integer NOT NULL,
    proof_token character varying(255) NOT NULL,
    proof_token_expires_at timestamp without time zone NOT NULL,
    charged_micro bigint DEFAULT 0 NOT NULL,
    viewer_reward_micro bigint DEFAULT 0 NOT NULL,
    company_share_micro bigint DEFAULT 0 NOT NULL,
    viewer_reward numeric(10,3) DEFAULT 0.000 NOT NULL,
    company_fee numeric(10,3) DEFAULT 0.000 NOT NULL,
    total_cost numeric(10,3) DEFAULT 0.000 NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    watched_duration_ms integer,
    required_duration_ms integer NOT NULL,
    completion_duration integer,
    required_duration integer DEFAULT 10 NOT NULL,
    viewed_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.view_events OWNER TO postgres;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    balance_micro bigint DEFAULT 0 NOT NULL,
    balance numeric(10,3) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdrawals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(10,3) NOT NULL,
    amount_micro bigint DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.withdrawals OWNER TO postgres;

--
-- Name: advertiser_packages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advertiser_packages ALTER COLUMN id SET DEFAULT nextval('public.advertiser_packages_id_seq'::regclass);


--
-- Data for Name: ad_appeals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ad_appeals (id, ad_id, advertiser_id, reason, status, admin_response, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ad_verification_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ad_verification_history (id, ad_id, admin_id, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: admin_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_settings (id, key, value, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ads (id, advertiser_id, package_id, purchased_package_id, media_url, title, description, section, status, is_active, verification_status, image_key, link, cta_link, cta_text, cta_enabled, budget, views, spent, created_at, updated_at) FROM stdin;
24bdd8e4-95c7-4743-949a-8845ea53c89a	6603153d-1a73-48c2-8b4c-219c2f45a727	1	79336e51-4cf2-4b44-bbd7-8015baf39b85	/uploads/test.mp4	Test Ad	Test Description	retail	approved	t	approved	\N	\N	\N	Learn More	t	0.000	0	0.000	2025-10-27 16:52:32.565974	2025-10-27 16:52:32.565974
\.


--
-- Data for Name: advertiser_packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advertiser_packages (id, name, duration, price_per_view_micro, viewer_reward_percentage, company_share_percentage, estimated_views, is_active, created_at, updated_at) FROM stdin;
1	P10 - 10 Second Ads	10	10000	50.00	50.00	1000	t	2025-10-27 16:40:49.665497	2025-10-27 16:40:49.665497
2	P15 - 15 Second Ads	15	15000	50.00	50.00	667	t	2025-10-27 16:40:49.665497	2025-10-27 16:40:49.665497
3	P20 - 20 Second Ads	20	20000	50.00	50.00	500	t	2025-10-27 16:40:49.665497	2025-10-27 16:40:49.665497
4	P30 - 30 Second Ads	30	30000	50.00	50.00	333	t	2025-10-27 16:40:49.665497	2025-10-27 16:40:49.665497
\.


--
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_likes (id, comment_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, ad_id, user_id, content, likes_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: company_wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_wallets (id, balance_micro, balance, total_fees_collected_micro, total_fees_collected, total_rewards_paid_micro, total_rewards_paid, created_at, updated_at) FROM stdin;
06b17c92-444a-4d74-a457-1127834e6837	0	0.000	0	0.000	0	0.000	2025-10-27 16:41:06.91191	2025-10-27 16:41:06.91191
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, type, is_read, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_codes (id, phone, code, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: purchased_packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchased_packages (id, advertiser_id, package_id, purchased_budget_micro, remaining_budget_micro, used_budget_micro, purchased_budget, remaining_budget, used_budget, estimated_views, views_completed, status, purchased_at, expires_at, created_at, updated_at) FROM stdin;
79336e51-4cf2-4b44-bbd7-8015baf39b85	6603153d-1a73-48c2-8b4c-219c2f45a727	1	10000000	10000000	0	10.000	10.000	0.000	1000	0	active	2025-10-27 16:52:32.565974	\N	2025-10-27 16:52:32.565974	2025-10-27 16:52:32.565974
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sections (id, key, title, description, icon, color, sort_order, is_active, created_at, updated_at) FROM stdin;
b2ec075d-8b13-4dc1-84fc-1e7b7d8261bf	retail	Retail & Shopping	Discover amazing deals and products	shopping_cart	#FF6B6B	1	t	2025-10-27 16:40:38.888321	2025-10-27 16:40:38.888321
bf8eef95-9dcd-4815-b54a-7fab5ee9e14e	food	Food & Restaurants	Delicious dining experiences	restaurant	#4ECDC4	2	t	2025-10-27 16:40:38.888321	2025-10-27 16:40:38.888321
3a0e15fb-2645-4633-96b8-63c1ffa88cd4	health	Health & Wellness	Healthcare and fitness services	favorite	#95E1D3	3	t	2025-10-27 16:40:38.888321	2025-10-27 16:40:38.888321
180bc47b-316f-496d-af3f-6b9b89404531	education	Education & Training	Learning opportunities	school	#F38181	4	t	2025-10-27 16:40:38.888321	2025-10-27 16:40:38.888321
e9430da9-7b99-4d82-80ba-a90548a2d3ed	automotive	Automotive	Cars and vehicle services	directions_car	#FEE140	5	t	2025-10-27 16:40:38.888321	2025-10-27 16:40:38.888321
cbb04621-ebdf-482f-a06d-68ab63a39f65	real_estate	Real Estate	Properties and housing	home	#764BA2	6	t	2025-10-27 16:40:38.888321	2025-10-27 16:40:38.888321
0fca0648-423a-48bc-b875-5a2773499157	entertainment	Entertainment	Fun and leisure activities	movie	#667EEA	7	t	2025-10-27 16:40:38.888321	2025-10-27 16:40:38.888321
896ee7ba-0fb2-4c14-9167-31072ff2388a	services	Professional Services	Business and personal services	build	#F093FB	8	t	2025-10-27 16:40:38.888321	2025-10-27 16:40:38.888321
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_id, from_wallet_id, to_wallet_id, amount_micro, amount, type, status, transaction_category, reference, reference_id, meta, processed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, civil_id, phone, role, kyc_status, civil_front_key, civil_back_key, company_name, license_number, signatory_name, license_doc_key, verified_at, email, commercial_registration_number, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000000	System Admin	\N	+96550000000	admin	verified	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-27 16:40:58.78722	2025-10-27 16:40:58.78722
6603153d-1a73-48c2-8b4c-219c2f45a727	Test Advertiser	\N	+96551111111	advertiser	verified	\N	\N	Test Company	LIC123	\N	\N	\N	\N	\N	2025-10-27 16:42:18.133239	2025-10-27 16:42:18.133239
3227c136-cca0-4ab0-bf35-a79f2cd6b227	Test Viewer	123456789012	+96552222222	viewer	verified	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-27 16:42:25.924803	2025-10-27 16:42:25.924803
\.


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.videos (id, url, title, size, user_id, ad_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: view_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.view_events (id, ad_id, user_id, purchased_package_id, package_id, proof_token, proof_token_expires_at, charged_micro, viewer_reward_micro, company_share_micro, viewer_reward, company_fee, total_cost, is_completed, watched_duration_ms, required_duration_ms, completion_duration, required_duration, viewed_at, completed_at) FROM stdin;
18b092f6-652c-4374-9235-fabe3cb89f99	24bdd8e4-95c7-4743-949a-8845ea53c89a	3227c136-cca0-4ab0-bf35-a79f2cd6b227	79336e51-4cf2-4b44-bbd7-8015baf39b85	1	test_token_e532e425-0061-47b3-b19a-8aa738955762	2025-10-27 16:57:47.725953	0	0	0	0.000	0.000	0.000	t	\N	10000	\N	10	2025-10-27 16:52:47.725953	2025-10-27 16:52:47.725953
0e75a196-0520-40db-b9b7-4666388a6965	24bdd8e4-95c7-4743-949a-8845ea53c89a	3227c136-cca0-4ab0-bf35-a79f2cd6b227	79336e51-4cf2-4b44-bbd7-8015baf39b85	1	test_token_old_1a19ad9a-cf7a-40be-9daf-bd82011503f2	2025-10-27 16:58:04.340538	0	0	0	0.000	0.000	0.000	t	\N	10000	\N	10	2025-10-27 16:53:04.340538	2025-10-26 15:53:04.340538
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (id, user_id, balance_micro, balance, created_at, updated_at) FROM stdin;
a0be6e65-b3de-443e-ba5d-56d847935082	6603153d-1a73-48c2-8b4c-219c2f45a727	1000000000	1000.000	2025-10-27 16:42:35.865561	2025-10-27 16:42:35.865561
3a238cee-eac6-4efc-ba40-cce179d46242	3227c136-cca0-4ab0-bf35-a79f2cd6b227	0	0.000	2025-10-27 16:42:35.865561	2025-10-27 16:42:35.865561
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.withdrawals (id, user_id, amount, amount_micro, status, approved, created_at, updated_at) FROM stdin;
\.


--
-- Name: advertiser_packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.advertiser_packages_id_seq', 4, true);


--
-- Name: ad_appeals ad_appeals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_appeals
    ADD CONSTRAINT ad_appeals_pkey PRIMARY KEY (id);


--
-- Name: ad_verification_history ad_verification_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_verification_history
    ADD CONSTRAINT ad_verification_history_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_key_key UNIQUE (key);


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: advertiser_packages advertiser_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advertiser_packages
    ADD CONSTRAINT advertiser_packages_pkey PRIMARY KEY (id);


--
-- Name: comment_likes comment_likes_comment_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_user_id_key UNIQUE (comment_id, user_id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: company_wallets company_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_wallets
    ADD CONSTRAINT company_wallets_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: purchased_packages purchased_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchased_packages
    ADD CONSTRAINT purchased_packages_pkey PRIMARY KEY (id);


--
-- Name: sections sections_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_key_key UNIQUE (key);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_civil_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_civil_id_key UNIQUE (civil_id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: view_events view_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_events
    ADD CONSTRAINT view_events_pkey PRIMARY KEY (id);


--
-- Name: view_events view_events_proof_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_events
    ADD CONSTRAINT view_events_proof_token_key UNIQUE (proof_token);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: idx_ads_advertiser_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ads_advertiser_id ON public.ads USING btree (advertiser_id);


--
-- Name: idx_ads_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ads_is_active ON public.ads USING btree (is_active);


--
-- Name: idx_ads_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ads_section ON public.ads USING btree (section);


--
-- Name: idx_ads_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ads_status ON public.ads USING btree (status);


--
-- Name: idx_ads_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ads_verification_status ON public.ads USING btree (verification_status);


--
-- Name: idx_comments_ad_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_ad_id ON public.comments USING btree (ad_id);


--
-- Name: idx_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_purchased_packages_advertiser_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchased_packages_advertiser_id ON public.purchased_packages USING btree (advertiser_id);


--
-- Name: idx_purchased_packages_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchased_packages_status ON public.purchased_packages USING btree (status);


--
-- Name: idx_sessions_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_expire ON public.sessions USING btree (expire);


--
-- Name: idx_transactions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at DESC);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);


--
-- Name: idx_transactions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);


--
-- Name: idx_users_civil_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_civil_id ON public.users USING btree (civil_id);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_view_events_24hr_reward_check; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_view_events_24hr_reward_check ON public.view_events USING btree (user_id, ad_id, is_completed, completed_at DESC) WHERE (is_completed = true);


--
-- Name: idx_view_events_ad_completed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_view_events_ad_completed ON public.view_events USING btree (ad_id, is_completed, completed_at DESC);


--
-- Name: idx_view_events_ad_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_view_events_ad_id ON public.view_events USING btree (ad_id);


--
-- Name: idx_view_events_is_completed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_view_events_is_completed ON public.view_events USING btree (is_completed);


--
-- Name: idx_view_events_proof_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_view_events_proof_token ON public.view_events USING btree (proof_token);


--
-- Name: idx_view_events_user_completed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_view_events_user_completed_at ON public.view_events USING btree (user_id, completed_at DESC) WHERE (is_completed = true);


--
-- Name: idx_view_events_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_view_events_user_id ON public.view_events USING btree (user_id);


--
-- Name: idx_wallets_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallets_user_id ON public.wallets USING btree (user_id);


--
-- Name: idx_withdrawals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_withdrawals_status ON public.withdrawals USING btree (status);


--
-- Name: idx_withdrawals_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_withdrawals_user_id ON public.withdrawals USING btree (user_id);


--
-- Name: ad_appeals ad_appeals_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_appeals
    ADD CONSTRAINT ad_appeals_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_appeals ad_appeals_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_appeals
    ADD CONSTRAINT ad_appeals_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.users(id);


--
-- Name: ad_verification_history ad_verification_history_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_verification_history
    ADD CONSTRAINT ad_verification_history_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_verification_history ad_verification_history_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_verification_history
    ADD CONSTRAINT ad_verification_history_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: ads ads_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ads ads_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.advertiser_packages(id);


--
-- Name: ads ads_purchased_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_purchased_package_id_fkey FOREIGN KEY (purchased_package_id) REFERENCES public.purchased_packages(id);


--
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: comments comments_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: purchased_packages purchased_packages_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchased_packages
    ADD CONSTRAINT purchased_packages_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: purchased_packages purchased_packages_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchased_packages
    ADD CONSTRAINT purchased_packages_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.advertiser_packages(id);


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: videos videos_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE SET NULL;


--
-- Name: videos videos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: view_events view_events_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_events
    ADD CONSTRAINT view_events_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id);


--
-- Name: view_events view_events_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_events
    ADD CONSTRAINT view_events_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.advertiser_packages(id);


--
-- Name: view_events view_events_purchased_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_events
    ADD CONSTRAINT view_events_purchased_package_id_fkey FOREIGN KEY (purchased_package_id) REFERENCES public.purchased_packages(id);


--
-- Name: view_events view_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_events
    ADD CONSTRAINT view_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: withdrawals withdrawals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

