import { supabase } from '../db';

// Create a new inventory audit
export const createInventoryAuditService = async (auditData) => {
  try {
    // Get Egyptian timestamp
    const egyptianTimestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');

    const { data, error } = await supabase
      .from('inventory_audits')
      .insert({
        warehouse_id: auditData.warehouse_id,
        user_id: auditData.user_id,
        audit_type: auditData.audit_type,
        notes: auditData.notes,
        started_at: new Date().toISOString(),
        egyptian_timestamp: egyptianTimestamp
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory audit:', error);
      throw new Error('Failed to create inventory audit');
    }

    return {
      ...data,
      message: 'Inventory audit created successfully'
    };
  } catch (error) {
    console.error('Error creating inventory audit:', error);
    throw error;
  }
};

// Get all inventory audits with optional filters
export const getInventoryAuditsService = async (params = {}) => {
  try {
    let query = supabase
      .from('inventory_audits')
      .select(`
        *,
        warehouses (name),
        users (name)
      `)
      .order('created_at', { ascending: false });

    if (params.warehouseId) {
      query = query.eq('warehouse_id', params.warehouseId);
    }

    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching inventory audits:', error);
      throw new Error('Failed to fetch inventory audits');
    }

    return data;
  } catch (error) {
    console.error('Error fetching inventory audits:', error);
    throw error;
  }
};

// Get inventory audit by ID
export const getInventoryAuditByIdService = async (id) => {
  try {
    const { data, error } = await supabase
      .from('inventory_audits')
      .select(`
        *,
        warehouses (name),
        users (name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching inventory audit:', error);
      throw new Error('Failed to fetch inventory audit');
    }

    if (!data) {
      throw new Error('Inventory audit not found');
    }

    return data;
  } catch (error) {
    console.error('Error fetching inventory audit by ID:', error);
    throw error;
  }
};

// Update inventory audit
export const updateInventoryAuditService = async (id, updateData) => {
  try {
    const { data, error } = await supabase
      .from('inventory_audits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating inventory audit:', error);
      throw new Error('Failed to update inventory audit');
    }

    if (!data) {
      throw new Error('Inventory audit not found');
    }

    return {
      ...data,
      message: 'Inventory audit updated successfully'
    };
  } catch (error) {
    console.error('Error updating inventory audit:', error);
    throw error;
  }
};

// Create audit detail
export const createAuditDetailService = async (detailData) => {
  try {
    // Calculate discrepancy
    const discrepancy = detailData.actual_quantity - detailData.expected_quantity;

    const { data, error } = await supabase
      .from('audit_details')
      .insert({
        inventory_audit_id: detailData.inventory_audit_id,
        item_id: detailData.item_id,
        expected_quantity: detailData.expected_quantity,
        actual_quantity: detailData.actual_quantity,
        discrepancy: discrepancy,
        notes: detailData.notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating audit detail:', error);
      throw new Error('Failed to create audit detail');
    }

    return {
      ...data,
      message: 'Audit detail created successfully'
    };
  } catch (error) {
    console.error('Error creating audit detail:', error);
    throw error;
  }
};

// Get audit details by inventory audit ID
export const getAuditDetailsByAuditIdService = async (inventoryAuditId) => {
  try {
    const { data, error } = await supabase
      .from('audit_details')
      .select(`
        *,
        items (name)
      `)
      .eq('inventory_audit_id', inventoryAuditId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit details:', error);
      throw new Error('Failed to fetch audit details');
    }

    return data;
  } catch (error) {
    console.error('Error fetching audit details:', error);
    throw error;
  }
};

// Update audit detail
export const updateAuditDetailService = async (id, updateData) => {
  try {
    const { data, error } = await supabase
      .from('audit_details')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating audit detail:', error);
      throw new Error('Failed to update audit detail');
    }

    if (!data) {
      throw new Error('Audit detail not found');
    }

    return {
      ...data,
      message: 'Audit detail updated successfully'
    };
  } catch (error) {
    console.error('Error updating audit detail:', error);
    throw error;
  }
};

// Get audit statistics
export const getAuditStatisticsService = async (warehouseId = null) => {
  try {
    let query = supabase
      .from('inventory_audits')
      .select(`
        status,
        count:count()
      `)
      .group('status');

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit statistics:', error);
      throw new Error('Failed to fetch audit statistics');
    }

    // Convert to object for easier access
    const stats = {};
    data.forEach(item => {
      stats[item.status] = item.count;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    throw error;
  }
};

// Get discrepancy report
export const getDiscrepancyReportService = async (params = {}) => {
  try {
    let query = supabase
      .from('audit_details')
      .select(`
        *,
        items (name),
        inventory_audits (audit_type, status),
        warehouses (name)
      `)
      .neq('discrepancy', 0)
      .order('discrepancy', { ascending: false });

    if (params.warehouseId) {
      query = query.eq('items.warehouse_id', params.warehouseId);
    }

    if (params.auditId) {
      query = query.eq('inventory_audit_id', params.auditId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching discrepancy report:', error);
      throw new Error('Failed to fetch discrepancy report');
    }

    return data;
  } catch (error) {
    console.error('Error fetching discrepancy report:', error);
    throw error;
  }
};

export default {
  createInventoryAudit: createInventoryAuditService,
  getInventoryAudits: getInventoryAuditsService,
  getInventoryAuditById: getInventoryAuditByIdService,
  updateInventoryAudit: updateInventoryAuditService,
  createAuditDetail: createAuditDetailService,
  getAuditDetailsByAuditId: getAuditDetailsByAuditIdService,
  updateAuditDetail: updateAuditDetailService,
  getAuditStatistics: getAuditStatisticsService,
  getDiscrepancyReport: getDiscrepancyReportService
};