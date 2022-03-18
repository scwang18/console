/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import { action, observable } from 'mobx'
import Base from 'stores/base'

export default class CDStore extends Base {
  module = 'cds'

  @observable
  list = {
    data: [],
    page: 1,
    limit: 10,
    total: 0,
    order: '',
    filters: {},
    isLoading: false,
    selectedRowKeys: [],
  }

  @observable
  detail = {}

  @observable
  syncResult = {
    data: [],
    page: 1,
    total: 0,
    filters: {},
    isLoading: false,
  }

  getPath({ cluster, namespace, workspace, devops } = {}) {
    let path = ''
    if (cluster) {
      path += `/klusters/${cluster}`
    }
    if (workspace) {
      path += `/workspaces/${workspace}`
    }
    if (namespace) {
      path += `/namespaces/${namespace}`
    }
    if (devops) {
      path += `/devops/${devops}`
    }
    return path
  }

  getListUrl = (params = {}) =>
    `${this.apiVersion}${this.getPath(params)}/applications${
      params.dryRun ? '?dryRun=All' : ''
    }`

  getResourceUrl = (params = {}) =>
    `${this.apiVersion}${this.getPath(params)}/applications`

  getDetailUrl = (params = {}) =>
    `${this.getListUrl(params)}/applications/${params.name}`

  @action
  setSelectRowKeys = selectedRowKeys => {
    this.list.selectedRowKeys = selectedRowKeys
  }

  @action
  async fetchList({ devops, workspace, cluster, more, ...params } = {}) {
    this.list.isLoading = true

    if (params.limit === Infinity || params.limit === -1) {
      params.limit = -1
      params.page = 1
    }

    params.limit = params.limit || 10

    const url = `${this.getResourceUrl({ namespace: devops })}`

    const result = await request.get(url, { ...params }, {}, () => {
      return { items: [] }
    })

    const data = result.items.map(item => {
      return { ...this.mapper(item) }
    })

    this.list.update({
      data: more ? [...this.list.data, ...data] : data,
      total: result.totalItems || result.total_count || data.length || 0,
      ...params,
      limit: Number(params.limit) || 10,
      page: Number(params.page) || 1,
      isLoading: false,
      ...(this.list.silent ? {} : { selectedRowKeys: [] }),
    })
    return data
  }

  @action
  async create({ data, devops }) {
    const url = `${this.getResourceUrl({ namespace: devops })}`
    const result = await request.post(url, data)
    return result
  }

  async fetchDetail({ name, isSilent, devops }) {
    if (!isSilent) {
      this.isLoading = true
    }

    const resultKub = await request.get(
      `${this.getResourceUrl({ namespace: devops })}/${name}`
    )

    const result = this.mapper(resultKub)

    this.detail = result
    this.isLoading = false
    return result
  }
}
