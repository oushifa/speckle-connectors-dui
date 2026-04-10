import type { CategoryOption } from './types'

/**
 * Hardcoded Revit BuiltInCategories for the Interop Lite mapper.
 */
export const REVIT_CATEGORIES: readonly CategoryOption[] = [
  // INFRASTRUCTURE
  { value: 'OST_BridgeAbutments', label: '桥台' },
  { value: 'OST_AbutmentFoundations', label: '桥台基础' },
  { value: 'OST_AbutmentPiles', label: '桥台桩' },
  { value: 'OST_AbutmentWalls', label: '桥台墙' },
  { value: 'OST_ApproachSlabs', label: '引桥板' },
  { value: 'OST_BridgeBearings', label: '支座' },
  { value: 'OST_BridgeCables', label: '桥梁索' },
  { value: 'OST_BridgeDecks', label: '桥面' },
  { value: 'OST_BridgeFraming', label: '桥梁构架' },
  { value: 'OST_BridgeArches', label: '桥拱' },
  { value: 'OST_BridgeFramingCrossBracing', label: '桥梁构架 - 横向支撑' },
  { value: 'OST_BridgeFramingDiaphragms', label: '桥梁构架 - 横隔板' },
  { value: 'OST_BridgeGirders', label: '桥梁构架 - 主梁' },
  { value: 'OST_BridgeFramingTrusses', label: '桥梁构架 - 桁架' },
  { value: 'OST_ExpansionJoints', label: '伸缩缝' },
  { value: 'OST_BridgePiers', label: '桥墩' },
  { value: 'OST_PierCaps', label: '墩帽' },
  { value: 'OST_PierColumns', label: '墩柱' },
  { value: 'OST_BridgeFoundations', label: '墩基础' },
  { value: 'OST_PierPiles', label: '墩桩' },
  { value: 'OST_BridgeTowers', label: '桥塔/墩塔' },
  { value: 'OST_PierWalls', label: '墩墙' },
  { value: 'OST_StructuralTendons', label: '结构预应力筋' },
  { value: 'OST_VibrationManagement', label: '减振管理' },
  { value: 'OST_VibrationDampers', label: '阻尼器' },
  { value: 'OST_VibrationIsolators', label: '隔振器' },

  // ARCHITECTURE
  { value: 'OST_AudioVisualDevices', label: '视听设备' },
  { value: 'OST_Casework', label: '橱柜/固定家具' },
  { value: 'OST_Ceilings', label: '天花板' },
  { value: 'OST_Columns', label: '柱' },
  { value: 'OST_CurtainWallPanels', label: '幕墙面板' },
  // { value: 'OST_CurtaSystem', label: 'Curtain Systems' }, excluded as part of CNX-2299
  { value: 'OST_CurtainWallMullions', label: '幕墙竖梃' },
  { value: 'OST_Doors', label: '门' },
  { value: 'OST_Entourage', label: '环境配景' },
  { value: 'OST_FireProtection', label: '消防' },
  { value: 'OST_Floors', label: '楼板' },
  { value: 'OST_FoodServiceEquipment', label: '餐饮设备' },
  { value: 'OST_Furniture', label: '家具' },
  { value: 'OST_FurnitureSystems', label: '家具系统' },
  { value: 'OST_GenericModel', label: '通用模型' },
  { value: 'OST_Hardscape', label: '硬质景观' },
  { value: 'OST_Lines', label: '线' },
  { value: 'OST_Mass', label: '体量' },
  { value: 'OST_MechanicalControlDevices', label: '机械控制装置' },
  { value: 'OST_MechanicalEquipment', label: '机械设备' },
  { value: 'OST_MedicalEquipment', label: '医疗设备' },
  { value: 'OST_Parking', label: '停车' },
  { value: 'OST_Parts', label: '部件' },
  { value: 'OST_Planting', label: '种植' },
  { value: 'OST_PlumbingEquipment', label: '给排水设备' },
  { value: 'OST_PlumbingFixtures', label: '给排水器具' },
  { value: 'OST_StairsRailing', label: '栏杆' },
  { value: 'OST_StairsRailingBaluster', label: '栏杆 - 栏杆柱' },
  { value: 'OST_RailingSupport', label: '栏杆 - 支撑' },
  { value: 'OST_RailingTermination', label: '栏杆 - 端部' },
  { value: 'OST_Ramps', label: '坡道' },
  { value: 'OST_Roads', label: '道路' },
  { value: 'OST_Roofs', label: '屋顶' },
  { value: 'OST_Signage', label: '标识' },
  { value: 'OST_Site', label: '场地' },
  { value: 'OST_SpecialtyEquipment', label: '专用设备' },
  { value: 'OST_Stairs', label: '楼梯' },
  { value: 'OST_TemporaryStructure', label: '临时结构' },
  { value: 'OST_Topography', label: '地形' },
  { value: 'OST_Toposolid', label: '地形实体' },
  { value: 'OST_VerticalCirculation', label: '竖向交通' },
  { value: 'OST_Walls', label: '墙' },
  { value: 'OST_Windows', label: '窗' },

  // ELECTRICAL
  { value: 'OST_CableTrayFitting', label: '电缆桥架配件' },
  { value: 'OST_CableTray', label: '电缆桥架' },
  { value: 'OST_CommunicationDevices', label: '通信设备' },
  { value: 'OST_ConduitFittings', label: '线管配件' },
  { value: 'OST_Conduit', label: '线管' },
  { value: 'OST_DataDevices', label: '数据设备' },
  { value: 'OST_ElectricalEquipment', label: '电气设备' },
  { value: 'OST_ElectricalFixtures', label: '电气装置' },
  { value: 'OST_FireAlarmDevices', label: '火灾报警设备' },
  { value: 'OST_LighintgDevices', label: '照明设备' },
  { value: 'OST_LightingFixtures', label: '照明灯具' },
  { value: 'OST_NurseCallDevices', label: '护士呼叫设备' },
  { value: 'OST_SecurityDevices', label: '安防设备' },
  { value: 'OST_TelephoneDevices', label: '电话设备' },

  // STRUCTURE
  { value: 'OST_Coupler', label: '钢筋套筒' },
  { value: 'OST_FabricAreas', label: '结构钢筋网片区域' },
  { value: 'OST_StructConnections', label: '结构连接' },
  { value: 'OST_StructConnectionAnchors', label: '结构连接 - 锚栓' },
  { value: 'OST_StructConnectionBolts', label: '结构连接 - 螺栓' },
  { value: 'OST_StructConnectionPlates', label: '结构连接 - 连接板' },
  { value: 'OST_StructConnectionProfiles', label: '结构连接 - 型材' },
  {
    value: 'OST_StructConnectionShearStuds',
    label: '结构连接 - 剪力栓'
  },
  { value: 'OST_StructConnectionWelds', label: '结构连接 - 焊缝' },
  // { value: 'OST_StructuralColumns', label: 'Structural Columns' }, excluded as part of CNX-2299
  { value: 'OST_StructuralFoundation', label: '结构基础' },
  { value: 'OST_StructuralFraming', label: '结构框架' },
  { value: 'OST_StructuralTruss', label: '结构桁架' },
  { value: 'OST_Rebar', label: '结构钢筋' },

  // MECHANICAL
  { value: 'OST_DuctTerminal', label: '风口' },
  { value: 'OST_DuctAccessory', label: '风管附件' },
  { value: 'OST_DuctFitting', label: '风管管件' },
  { value: 'OST_PlaceHolderDucts', label: '风管占位符' },
  { value: 'OST_DuctCurves', label: '风管' },
  { value: 'OST_MEPAncillaryFraming', label: '机电辅助支架' },

  // PIPING
  { value: 'OST_PipeAccessory', label: '管道附件' },
  { value: 'OST_PipeFitting', label: '管道管件' },
  { value: 'OST_PlaceHolderPipes', label: '管道占位符' },
  { value: 'OST_PipeSegments', label: '管段' },
  { value: 'OST_PipeCurves', label: '管道' },
  { value: 'OST_Sprinklers', label: '喷淋头' },

  // GENERAL/MULTI-DISCIPLINE
  { value: 'OST_CableTrayRun', label: '电缆桥架线路' },
  { value: 'OST_Coordination_Model', label: '协调模型' },
  { value: 'OST_DuctSystem', label: '风管系统' },
  { value: 'OST_PipingSystem', label: '管道系统' },
  { value: 'OST_StructuralFramingSystem', label: '结构梁系统' },
  { value: 'OST_StructuralStiffener', label: '结构加劲肋' }
] as const

/**
 * Get available categories sorted alphabetically by label.
 */
export function getAvailableCategories(): CategoryOption[] {
  return [...REVIT_CATEGORIES].sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Gets the human-readable label for a category value.
 */
export function getCategoryLabel(categoryValue: string): string {
  const category = REVIT_CATEGORIES.find((c) => c.value === categoryValue)
  return category?.label ?? categoryValue
}
