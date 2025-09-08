// backend/src/migrations/20241230-create-tables-no-fk.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create users table first (no dependencies)
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      role: {
        type: Sequelize.ENUM('viewer', 'advertiser', 'admin'),
        allowNull: false,
        defaultValue: 'viewer'
      },
      kyc_status: {
        type: Sequelize.ENUM('pending', 'verified', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      license_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      signatory_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      license_doc_key: {
        type: Sequelize.STRING,
        allowNull: true
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create videos table (no foreign keys yet)
    await queryInterface.createTable('videos', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sections: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: []
      },
      views: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      spent: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      advertiser_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create view_events table (no foreign keys yet)
    await queryInterface.createTable('view_events', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      video_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      viewed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create wallets table (no foreign keys yet)
    await queryInterface.createTable('wallets', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      balance: {
        type: Sequelize.DECIMAL(20, 3),
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create sections table
    await queryInterface.createTable('sections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create advertiser_packages table
    await queryInterface.createTable('advertiser_packages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      views: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('view_events');
    await queryInterface.dropTable('videos');
    await queryInterface.dropTable('wallets');
    await queryInterface.dropTable('sections');
    await queryInterface.dropTable('advertiser_packages');
    await queryInterface.dropTable('users');
  }
};
