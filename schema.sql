DROP TABLE IF EXISTS Replies;

CREATE TABLE IF NOT EXISTS Replies (
    guid TEXT PRIMARY KEY,
    url TEXT,
    message TEXT,
    email TEXT,
    parent TEXT,
    subscribe INTEGER DEFAULT 0,
    name TEXT,
    likes INTEGER DEFAULT 1,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME DEFAULT NULL,
    gravitar_hash TEXT
);

INSERT INTO Replies (guid, url, message, email, parent, subscribe, name, likes, created_at, updated_at, deleted_at, gravitar_hash) 
VALUES 
('11111111-1111-1111-1111-111111111111', 'test', 'This is a message', 'example@example.com', NULL, 0, 'John Doet', 10, '2024-08-20 00:00:00', '2024-08-20 00:00:00', NULL, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
('22222222-2222-2222-2222-222222222222', 'test', 'Another message', 'another@example.com', '11111111-1111-1111-1111-111111111111', 1, 'Jane Doe', 3, '2024-08-20 00:00:00', '2024-08-20 00:00:00', NULL, '4b227777d4dd1fc61c6f884f48641d02a1c65bc779a9a7dfb48fa0b9554f5d14'),
('33333333-3333-3333-3333-333333333333', 'test', 'Yet another message', 'yetanother@example.com', '22222222-2222-2222-2222-222222222222', 0, 'Jim Smith', 1, '2024-08-20 00:00:00', '2024-08-20 00:00:00', NULL, 'ca978112ca1bbdcafac231b39a23dc4da786eff8167f13394f7e0d891a55ab6a');
