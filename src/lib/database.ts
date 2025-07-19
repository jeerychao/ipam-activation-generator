import prisma from './prisma';

export interface ActivationHistoryItem {
  id: string;
  serial: string;
  validity: string;
  activationCode: string;
  organization: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  remarks: string | null;
  createdAt: Date;
}

export interface CreateActivationHistoryData {
  serial: string;
  validity: string;
  activationCode: string;
  organization?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  remarks?: string;
}

export class ActivationHistoryService {
  // 保存激活历史记录
  static async saveActivationHistory(data: CreateActivationHistoryData): Promise<ActivationHistoryItem> {
    return await prisma.activationHistory.create({
      data: {
        serial: data.serial,
        validity: data.validity,
        activationCode: data.activationCode,
        organization: data.organization,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        address: data.address,
        remarks: data.remarks,
      },
    });
  }

  // 获取所有激活历史记录
  static async getAllActivationHistory(): Promise<ActivationHistoryItem[]> {
    return await prisma.activationHistory.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 获取分页的激活历史记录
  static async getActivationHistoryPaginated(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: ActivationHistoryItem[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const skip = (page - 1) * pageSize;
    
    const [data, total] = await Promise.all([
      prisma.activationHistory.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.activationHistory.count(),
    ]);

    return {
      data,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  }

  // 根据条件搜索激活历史记录
  static async searchActivationHistory(
    searchTerm: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: ActivationHistoryItem[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const skip = (page - 1) * pageSize;
    
    const whereClause = {
      OR: [
        { serial: { contains: searchTerm, mode: 'insensitive' as const } },
        { organization: { contains: searchTerm, mode: 'insensitive' as const } },
        { contactPerson: { contains: searchTerm, mode: 'insensitive' as const } },
        { contactPhone: { contains: searchTerm, mode: 'insensitive' as const } },
        { contactEmail: { contains: searchTerm, mode: 'insensitive' as const } },
        { address: { contains: searchTerm, mode: 'insensitive' as const } },
        { remarks: { contains: searchTerm, mode: 'insensitive' as const } },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.activationHistory.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.activationHistory.count({
        where: whereClause,
      }),
    ]);

    return {
      data,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  }

  // 清空所有激活历史记录
  static async clearAllActivationHistory(): Promise<void> {
    await prisma.activationHistory.deleteMany();
  }

  // 根据序列号查找激活历史记录
  static async findBySerial(serial: string): Promise<ActivationHistoryItem[]> {
    return await prisma.activationHistory.findMany({
      where: {
        serial,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 根据单位名称查找激活历史记录
  static async findByOrganization(organization: string): Promise<ActivationHistoryItem[]> {
    return await prisma.activationHistory.findMany({
      where: {
        organization: {
          contains: organization,
          mode: 'insensitive',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 删除指定的激活历史记录
  static async deleteById(id: string): Promise<void> {
    await prisma.activationHistory.delete({
      where: {
        id,
      },
    });
  }

  // 获取统计信息
  static async getStatistics(): Promise<{
    totalRecords: number;
    totalOrganizations: number;
    recentActivations: number;
  }> {
    const [totalRecords, totalOrganizations, recentActivations] = await Promise.all([
      prisma.activationHistory.count(),
      prisma.activationHistory.count({
        where: {
          organization: {
            not: null,
          },
        },
      }),
      prisma.activationHistory.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 最近30天
          },
        },
      }),
    ]);

    return {
      totalRecords,
      totalOrganizations,
      recentActivations,
    };
  }
} 