DELIMITER $$

CREATE PROCEDURE `sp_add_kary_farhan_ryan_rafli`(
    IN p_nip VARCHAR(255),
    IN p_nama VARCHAR(255),
    IN p_alamat VARCHAR(255),
    IN p_gend CHAR(1),
    IN p_tgl_lahir DATE,
    IN p_photo TEXT,
    IN p_insert_by VARCHAR(255)
)
BEGIN
    DECLARE exit handler for sqlexception
    BEGIN
        -- Rollback ERROR
        ROLLBACK;

        -- Log transaction yang gagal
        INSERT INTO log_trx_api (api, request, response, insert_at)
        VALUES ('api/karyawan', 
                CONCAT('{"nip": "', p_nip, '", "nama": "', p_nama, '", "alamat": "', p_alamat, '", "gend": "', p_gend, '", "tgl_lahir": "', p_tgl_lahir, '"}'),
                '{"message": "Failed to add karyawan, NIP already exists or other error"}',
                NOW());

        SELECT 'Error occurred, transaction rolled back' AS message;
    END;

    -- Start transaction
    START TRANSACTION;

    -- Check NIP 
    DECLARE existing_nip_count INT;
    SELECT COUNT(*) INTO existing_nip_count
    FROM karyawan
    WHERE nip = p_nip;

    -- if NIP exists, batalkan insertion
    IF existing_nip_count > 0 THEN
        ROLLBACK;
        
        -- Log transaction yang gagal
        INSERT INTO log_trx_api (api, request, response, insert_at)
        VALUES ('api/karyawan', 
                CONCAT('{"nip": "', p_nip, '", "nama": "', p_nama, '", "alamat": "', p_alamat, '", "gend": "', p_gend, '", "tgl_lahir": "', p_tgl_lahir, '"}'),
                '{"message": "Failed: Duplicate NIP"}',
                NOW());
                
        SELECT 'NIP already exists, transaction rolled back' AS message;
    ELSE
        -- Insert new karyawan data
        INSERT INTO karyawan (nip, nama, alamat, gend, tgl_lahir, photo, insert_at, insert_by, update_at, update_by)
        VALUES (p_nip, p_nama, p_alamat, p_gend, p_tgl_lahir, p_photo, NOW(), p_insert_by, NOW(), p_insert_by);

        -- Log transaction yang gagal
        INSERT INTO log_trx_api (api, request, response, insert_at)
        VALUES ('api/karyawan', 
                CONCAT('{"nip": "', p_nip, '", "nama": "', p_nama, '", "alamat": "', p_alamat, '", "gend": "', p_gend, '", "tgl_lahir": "', p_tgl_lahir, '"}'),
                CONCAT('{"message": "Karyawan successfully added", "nip": "', p_nip, '"}'),
                NOW());

        -- Commit transaction
        COMMIT;

        SELECT 'Karyawan added successfully' AS message;
    END IF;

END $$

DELIMITER ;

-- View: karyawan_farhan_ryan_rafli
CREATE OR REPLACE
ALGORITHM = UNDEFINED VIEW `karyawan_farhan_ryan_rafli` AS
select
	-- No sudah ada dari secara otomatis (jika diminta manual, memakai variabel selalu error :( )
    `karyawan`.`nip` AS `nip`,
    `karyawan`.`nama` AS `nama`,
    `karyawan`.`alamat` AS `alamat`,
    (case
        when (`karyawan`.`gend` = 'L') then 'Laki - Laki'
        when (`karyawan`.`gend` = 'P') then 'Perempuan'
        else 'Unknown'
    end) AS `Gend`,
    date_format(`karyawan`.`tgl_lahir`, '%d %M %Y') AS `Tanggal Lahir`
from
    `karyawan`;
