import { Button, Col, Form, Input, Modal, Row, Select, Space, Table } from 'antd'
import { useMemo, useState } from 'react'
import { CiEdit } from 'react-icons/ci'
import { MdDeleteOutline } from 'react-icons/md'
import { toast } from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import dictionaryApi from '@renderer/apis/dictionary-api'
import { useQuery } from '@tanstack/react-query'
const Dictionary: React.FC = () => {
  const [dictionaryParams, setDictionaryParams] = useState({
    page: 0,
    limit: 10
  })
  const [editDictionary, setEditDictionary] = useState<{
    id: number
    word: string
    pronunciation: string
    definition: string
    type: number
  } | null>(null)
  const {
    data: dictionaryList = { contents: [], total: 0, page: 0, limit: 0 },
    refetch: refetchDictionaryList
  } = useQuery({
    queryKey: ['dictionary', dictionaryParams],
    queryFn: ({ queryKey }) =>
      dictionaryApi.getDictionary(queryKey[1] as { page: number; limit: number })
  })
  const tableData = useMemo(() => {
    return dictionaryList.contents.map((item) => ({
      key: item.id,
      word: item.word,
      dictionary: item.type === 0 ? 'Anh - Việt' : 'Việt - Anh',
      meaning: item.definition,
      pronunciation: item.pronunciation
    }))
  }, [dictionaryList])
  const [isCreatingDictionary, setIsCreatingDictionary] = useState(false)
  const handleDeleteDictionary = async (id: number): Promise<void> => {
    try {
      await dictionaryApi.deleteDictionary(id)
      await refetchDictionaryList()
      toast.success('Xóa từ thành công')
    } catch (error) {
      console.log(error)
      toast.error('Xóa từ thất bại')
    }
  }
  const columns = [
    {
      title: 'Từ',
      dataIndex: 'word',
      key: 'word'
    },
    {
      title: 'từ điển',
      dataIndex: 'dictionary',
      key: 'dictionary'
    },
    {
      title: 'Phát âm',
      dataIndex: 'pronunciation',
      key: 'pronunciation'
    },
    {
      title: 'Nghĩa',
      dataIndex: 'meaning',
      key: 'meaning',
      with: 200,
      render: (text: string) => <div dangerouslySetInnerHTML={{ __html: text }} />
    },
    {
      title: 'Thao tác',
      dataIndex: 'action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<CiEdit />}
            size="large"
            onClick={() => {
              setEditDictionary({
                definition: record.meaning,
                word: record.word,
                pronunciation: record.pronunciation,
                type: record.dictionary === 'ev' ? 0 : 1,
                id: record.key
              })
              form.setFieldsValue({
                dictionary: record.dictionary === 'ev' ? 'ev' : 've',
                word: record.word,
                pronunciation: record.pronunciation,
                meaning: record.meaning
              })
              setIsCreatingDictionary(true)
            }}
          />
          <Button
            danger
            type="text"
            icon={<MdDeleteOutline />}
            size="large"
            onClick={() => handleDeleteDictionary(record.key)}
          />
        </Space>
      )
    }
  ]
  const [form] = Form.useForm()
  const handleCreateDictionary = async (values): Promise<void> => {
    try {
      if (editDictionary?.id) {
        await dictionaryApi.updateDictionary({
          id: editDictionary.id,
          word: values.word,
          pronunciation: values.pronunciation,
          definition: values.meaning,
          type: values.dictionary === 'ev' ? 0 : 1 //0: english -> vietnamese, 1: vietnamese -> english
        })
        await refetchDictionaryList()
        toast.success('Cập nhật từ thành công')
        setIsCreatingDictionary(false)
        form.resetFields()
        setEditDictionary(null)
        return
      }
      await dictionaryApi.createDictionary({
        word: values.word,
        pronunciation: values.pronunciation,
        definition: values.meaning,
        type: values.dictionary === 'ev' ? 0 : 1 //0: english -> vietnamese, 1: vietnamese -> english
      })
      await refetchDictionaryList()
      toast.success('Thêm từ thành công')
      setIsCreatingDictionary(false)
      form.resetFields()
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div className="p-4">
      <h4 className="text-lg font-bold text-center">Bổ sung từ điển</h4>
      <Table
        title={() => (
          <div className="flex justify-between">
            <h4 className="text-lg font-bold">Từ đã thêm</h4>
            <Button
              type="primary"
              onClick={() => {
                setIsCreatingDictionary(true)
                form.resetFields()
                setEditDictionary(null)
              }}
            >
              Thêm từ
            </Button>
          </div>
        )}
        columns={columns}
        dataSource={tableData}
        pagination={{
          pageSize: dictionaryList?.limit,
          total: dictionaryList?.total,
          current: dictionaryList?.page + 1,
          onChange: (page) => {
            setDictionaryParams({ ...dictionaryParams, page: page - 1 })
          }
        }}
      />
      <Modal
        open={isCreatingDictionary}
        onCancel={() => setIsCreatingDictionary(false)}
        footer={[]}
      >
        <Form
          layout="vertical"
          onFinish={handleCreateDictionary}
          form={form}
          onFinishFailed={() => {
            toast.error('Vui lòng điền đầy đủ thông tin')
          }}
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Từ điển"
                name="dictionary"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng chọn từ điển'
                  }
                ]}
              >
                <Select>
                  <Select.Option value="ev">Anh - Việt</Select.Option>
                  <Select.Option value="ve">Việt - Anh</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Từ"
                name="word"
                rules={[{ required: true, message: 'Vui lòng nhập từ' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Phát âm"
                name="pronunciation"
                rules={[{ required: true, message: 'Vui lòng nhập phát âm' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Định nghĩa" name="meaning">
            <ReactQuill theme="snow" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full">
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
export default Dictionary
