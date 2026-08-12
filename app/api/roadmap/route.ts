import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_ORG_NAME = 'Program Portfolio';
const DEFAULT_ROADMAP_NAME = 'Q4 2026 Program Roadmap';

async function ensureSeedData() {
  const organization = await prisma.organization.upsert({
    where: { name: DEFAULT_ORG_NAME },
    update: {},
    create: { name: DEFAULT_ORG_NAME },
  });

  let roadmap = await prisma.roadmap.findFirst({
    where: { organizationId: organization.id },
  });

  if (!roadmap) {
    roadmap = await prisma.roadmap.create({
      data: {
        name: DEFAULT_ROADMAP_NAME,
        organizationId: organization.id,
        startDate: '2026-09-01',
        endDate: '2027-03-31',
      },
    });

    await prisma.epic.createMany({
      data: [
        {
          roadmapId: roadmap.id,
          title: 'Platform Modernization',
          description: 'Modernize the shared platform foundation',
          status: 'On track',
          startDate: '2026-09-01',
          endDate: '2026-12-15',
          rank: 1,
        },
        {
          roadmapId: roadmap.id,
          title: 'Customer Data Integration',
          description: 'Integrate source systems and improve data quality',
          status: 'At risk',
          startDate: '2026-10-01',
          endDate: '2027-01-30',
          rank: 2,
        },
        {
          roadmapId: roadmap.id,
          title: 'AI Enablement',
          description: 'Increase adoption of AI-enabled workflows',
          status: 'Planned',
          startDate: '2026-11-15',
          endDate: '2027-03-10',
          rank: 3,
        },
      ],
    });

    await prisma.feature.createMany({
      data: [
        {
          roadmapId: roadmap.id,
          title: 'Shared API Gateway',
          status: 'Committed',
          startDate: '2026-09-01',
          endDate: '2026-10-15',
          rank: 1,
          pi: 'PI-01',
          team: 'Platform',
        },
        {
          roadmapId: roadmap.id,
          title: 'Data quality controls',
          status: 'In progress',
          startDate: '2026-09-20',
          endDate: '2026-11-20',
          rank: 2,
          pi: 'PI-01',
          team: 'Data',
        },
        {
          roadmapId: roadmap.id,
          title: 'Portfolio reporting',
          status: 'Planned',
          startDate: '2026-11-01',
          endDate: '2027-01-15',
          rank: 3,
          pi: 'PI-02',
          team: 'PMO',
        },
        {
          roadmapId: roadmap.id,
          title: 'Team onboarding flow',
          status: 'Planned',
          startDate: '2026-12-01',
          endDate: '2027-02-15',
          rank: 4,
          pi: 'PI-02',
          team: 'Delivery',
        },
      ],
    });

    await prisma.backlogItem.createMany({
      data: [
        { organizationId: organization.id, title: 'Dependency tracker', status: 'New', priority: 1 },
        { organizationId: organization.id, title: 'Risk heatmap', status: 'New', priority: 2 },
        { organizationId: organization.id, title: 'Portfolio export', status: 'Ready', priority: 3 },
        { organizationId: organization.id, title: 'Cross-team alignment dashboard', status: 'Ready', priority: 4 },
      ],
    });
  }

  return organization;
}

async function getRoadmapData() {
  const organization = await ensureSeedData();

  const roadmap = await prisma.roadmap.findFirst({
    where: { organizationId: organization.id },
    include: {
      epics: { orderBy: { rank: 'asc' } },
      features: { orderBy: { rank: 'asc' } },
      programIncrements: true,
    },
  });

  const backlog = await prisma.backlogItem.findMany({
    where: { organizationId: organization.id },
    orderBy: { priority: 'asc' },
  });

  return {
    roadmap,
    epics: roadmap?.epics ?? [],
    features: roadmap?.features ?? [],
    programIncrements: roadmap?.programIncrements ?? [],
    backlog,
  };
}

export async function GET() {
  try {
    const data = await getRoadmapData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch roadmap data:', error);
    return NextResponse.json({ error: 'Failed to fetch roadmap data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action;

    const organization = await ensureSeedData();
    const roadmap = await prisma.roadmap.findFirst({
      where: { organizationId: organization.id },
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    switch (action) {
      case 'create-epic': {
        const { title, status = 'Planned', startDate, endDate } = body ?? {};
        if (!title || !String(title).trim()) {
          return NextResponse.json({ error: 'Epic title is required' }, { status: 400 });
        }

        const existing = await prisma.epic.findMany({ where: { roadmapId: roadmap.id } });

        const epic = await prisma.epic.create({
          data: {
            roadmapId: roadmap.id,
            title: String(title).trim(),
            status,
            startDate: startDate ?? roadmap.startDate,
            endDate: endDate ?? roadmap.endDate,
            rank: existing.length + 1,
          },
        });

        return NextResponse.json({ epic });
      }

      case 'update-epic': {
        const { id, title, status, startDate, endDate } = body ?? {};
        if (!id) {
          return NextResponse.json({ error: 'Epic id required' }, { status: 400 });
        }

        const epic = await prisma.epic.update({
          where: { id },
          data: {
            title: title ?? undefined,
            status: status ?? undefined,
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
          },
        });

        return NextResponse.json({ epic });
      }

      case 'delete-epic': {
        const { id } = body ?? {};
        if (!id) {
          return NextResponse.json({ error: 'Epic id required' }, { status: 400 });
        }

        await prisma.epic.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      case 'create-pi': {
        const { name, startDate, endDate } = body ?? {};
        if (!name || !String(name).trim()) {
          return NextResponse.json({ error: 'Program increment name is required' }, { status: 400 });
        }

        const increment = await prisma.programIncrement.create({
          data: {
            roadmapId: roadmap.id,
            name: String(name).trim(),
            startDate: startDate ?? roadmap.startDate,
            endDate: endDate ?? roadmap.endDate,
          },
        });

        return NextResponse.json({ programIncrement: increment });
      }

      case 'update-pi': {
        const { id, name, startDate, endDate } = body ?? {};
        if (!id) {
          return NextResponse.json({ error: 'Program increment id required' }, { status: 400 });
        }

        const increment = await prisma.programIncrement.update({
          where: { id },
          data: {
            name: name ?? undefined,
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
          },
        });

        return NextResponse.json({ programIncrement: increment });
      }

      case 'delete-pi': {
        const { id } = body ?? {};
        if (!id) {
          return NextResponse.json({ error: 'Program increment id required' }, { status: 400 });
        }

        await prisma.programIncrement.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      case 'create-feature': {
        const { title, team = 'Program', pi = 'PI-03', startDate, endDate } = body ?? {};

        const existing = await prisma.feature.findMany({ where: { roadmapId: roadmap.id } });
        const nextRank = existing.length + 1;

        const feature = await prisma.feature.create({
          data: {
            roadmapId: roadmap.id,
            title,
            team,
            pi,
            startDate: startDate ?? '2027-01-01',
            endDate: endDate ?? '2027-02-15',
            status: 'New',
            rank: nextRank,
          },
        });

        return NextResponse.json({ feature });
      }

      case 'create-backlog': {
        const { title, status = 'New' } = body ?? {};
        const items = await prisma.backlogItem.findMany({ where: { organizationId: organization.id } });

        const backlogItem = await prisma.backlogItem.create({
          data: {
            organizationId: organization.id,
            title,
            status,
            priority: items.length + 1,
          },
        });

        return NextResponse.json({ backlogItem });
      }

      case 'update-roadmap': {
        const { name, startDate, endDate } = body ?? {};

        const roadmapUpdate = await prisma.roadmap.update({
          where: { id: roadmap.id },
          data: {
            name: name ?? undefined,
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
          },
        });

        return NextResponse.json({ roadmap: roadmapUpdate });
      }

      case 'update-feature': {
        const { id, title, team, pi, status, startDate, endDate } = body ?? {};
        if (!id) {
          return NextResponse.json({ error: 'Feature id required' }, { status: 400 });
        }

        const feature = await prisma.feature.update({
          where: { id },
          data: {
            title: title ?? undefined,
            team: team ?? undefined,
            pi: pi ?? undefined,
            status: status ?? undefined,
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
          },
        });

        return NextResponse.json({ feature });
      }

      case 'delete-feature': {
        const { id } = body ?? {};
        if (!id) {
          return NextResponse.json({ error: 'Feature id required' }, { status: 400 });
        }

        await prisma.feature.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      case 'reorder-features': {
        const { order } = body ?? {};
        if (!Array.isArray(order)) {
          return NextResponse.json({ error: 'Feature order is required' }, { status: 400 });
        }

        for (let index = 0; index < order.length; index += 1) {
          const id = order[index];
          await prisma.feature.update({
            where: { id },
            data: { rank: index + 1 },
          });
        }

        return NextResponse.json({ success: true });
      }

      case 'reorder-backlog': {
        const { order } = body ?? {};
        if (!Array.isArray(order)) {
          return NextResponse.json({ error: 'Backlog order is required' }, { status: 400 });
        }

        for (let index = 0; index < order.length; index += 1) {
          const id = order[index];
          await prisma.backlogItem.update({
            where: { id },
            data: { priority: index + 1 },
          });
        }

        return NextResponse.json({ success: true });
      }

      case 'update-backlog': {
        const { id, title, status } = body ?? {};
        if (!id) {
          return NextResponse.json({ error: 'Backlog item id required' }, { status: 400 });
        }

        const backlogItem = await prisma.backlogItem.update({
          where: { id },
          data: {
            title: title ?? undefined,
            status: status ?? undefined,
          },
        });

        return NextResponse.json({ backlogItem });
      }

      case 'delete-backlog': {
        const { id } = body ?? {};
        if (!id) {
          return NextResponse.json({ error: 'Backlog item id required' }, { status: 400 });
        }

        await prisma.backlogItem.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      case 'move-backlog-to-feature': {
        const { backlogId, targetFeatureId } = body ?? {};
        if (!backlogId) {
          return NextResponse.json({ error: 'Backlog item id required' }, { status: 400 });
        }

        const backlogItem = await prisma.backlogItem.findUnique({ where: { id: backlogId } });
        if (!backlogItem) {
          return NextResponse.json({ error: 'Backlog item not found' }, { status: 404 });
        }

        const features = await prisma.feature.findMany({ where: { roadmapId: roadmap.id } });
        const featurePosition = targetFeatureId
          ? features.findIndex((feature) => feature.id === targetFeatureId)
          : features.length;

        const newFeature = await prisma.feature.create({
          data: {
            roadmapId: roadmap.id,
            title: backlogItem.title,
            team: 'Program',
            pi: 'PI-03',
            status: 'New',
            rank: featurePosition >= 0 ? featurePosition + 1 : features.length + 1,
            startDate: '2027-01-01',
            endDate: '2027-02-15',
          },
        });

        await prisma.backlogItem.delete({ where: { id: backlogItem.id } });

        return NextResponse.json({ feature: newFeature });
      }

      default:
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to update roadmap data:', error);
    return NextResponse.json({ error: 'Failed to update roadmap data' }, { status: 500 });
  }
}
